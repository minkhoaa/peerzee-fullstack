import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoDatingService } from './video-dating.service';
import { JoinQueueDto } from './dto/join-queue.dto';
import { AiService } from '../ai/ai.service';
import { UserProfile } from '../user/entities/user-profile.entity';

@WebSocketGateway({
    namespace: '/socket/video-dating',
    cors: {
        origin: '*',
        credentials: true,
    },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VideoDatingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VideoDatingGateway.name);

    // Track active video sessions: sessionId -> { user1SocketId, user2SocketId }
    private activeSessions: Map<string, { user1: string; user2: string; user1Id: string; user2Id: string }> = new Map();
    // Track user -> current sessionId
    private userSessions: Map<string, string> = new Map();

    // 🎬 AI DATING HOST: Game Loop interval
    private gameLoopInterval: NodeJS.Timeout | null = null;
    private readonly BLUR_DECREASE_INTERVAL = 60000; // Every 60s
    private readonly TOPIC_ROTATION_INTERVAL = 90000; // Every 90s
    private readonly SILENCE_THRESHOLD = 15000; // 15s silence = rescue topic

    constructor(
        private readonly jwtService: JwtService,
        private readonly videoDatingService: VideoDatingService,
        private readonly aiService: AiService,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
    ) { }

    /**
     * 🎬 AI DATING HOST: Initialize Game Loop when Gateway starts
     */
    afterInit() {
        this.logger.log('🎬 VideoDatingGateway initialized - Starting AI Host Game Loop');
        this.startGameLoop();
    }

    /**
     * 🎬 AI DATING HOST: The Game Loop
     * Runs every 30 seconds to manage all active blind date sessions
     */
    private startGameLoop() {
        // Run every 30 seconds
        this.gameLoopInterval = setInterval(async () => {
            const sessions = this.videoDatingService.getActiveBlindSessions();

            for (const [sessionId, blindSession] of sessions.entries()) {
                const socketSession = this.activeSessions.get(sessionId);
                if (!socketSession) continue;

                const durationSec = this.videoDatingService.getSessionDuration(sessionId);

                // 1. BLUR MANAGEMENT: Decrease blur every 60s
                if (durationSec > 0 && durationSec % 60 < 30 && blindSession.blurLevel > 0) {
                    const newBlur = this.videoDatingService.decreaseBlur(sessionId, 3);

                    // Emit blur update to both users
                    this.server.to(socketSession.user1).emit('blind:blur_update', {
                        sessionId,
                        blurLevel: newBlur,
                        message: newBlur > 0
                            ? `Chemistry đang tăng! Blur còn ${newBlur}px 💕`
                            : '🎉 MẶT ĐÃ LỘ DIỆN! Các bạn có muốn Match không?',
                    });
                    this.server.to(socketSession.user2).emit('blind:blur_update', {
                        sessionId,
                        blurLevel: newBlur,
                        message: newBlur > 0
                            ? `Chemistry đang tăng! Blur còn ${newBlur}px 💕`
                            : '🎉 MẶT ĐÃ LỘ DIỆN! Các bạn có muốn Match không?',
                    });
                }

                // 2. TOPIC ROTATION: New topic every 90s OR on silence
                const isSilent = this.videoDatingService.isSessionSilent(sessionId, this.SILENCE_THRESHOLD);
                const shouldRotateTopic = (durationSec > 0 && durationSec % 90 < 30) || isSilent;

                if (shouldRotateTopic && blindSession.topicHistory.length < 10) {
                    try {
                        const [profileA, profileB] = await Promise.all([
                            this.profileRepo.findOne({ where: { user_id: blindSession.participants[0] } }),
                            this.profileRepo.findOne({ where: { user_id: blindSession.participants[1] } }),
                        ]);

                        if (profileA && profileB) {
                            const newTopic = await this.aiService.generateDateTopic(
                                {
                                    display_name: profileA.display_name,
                                    occupation: profileA.occupation,
                                    tags: profileA.tags as string[],
                                    bio: profileA.bio,
                                },
                                {
                                    display_name: profileB.display_name,
                                    occupation: profileB.occupation,
                                    tags: profileB.tags as string[],
                                    bio: profileB.bio,
                                },
                                blindSession.topicHistory,
                                isSilent, // Silence rescue mode
                            );

                            this.videoDatingService.addTopic(sessionId, newTopic);

                            // Emit new topic to both users
                            const topicEvent = {
                                sessionId,
                                topic: newTopic,
                                isRescue: isSilent,
                                topicNumber: blindSession.topicHistory.length,
                            };
                            this.server.to(socketSession.user1).emit('blind:new_topic', topicEvent);
                            this.server.to(socketSession.user2).emit('blind:new_topic', topicEvent);

                            if (isSilent) {
                                this.logger.log(`🆘 Silence rescue for session ${sessionId}`);
                            }
                        }
                    } catch (error) {
                        this.logger.error(`Failed to generate topic for session ${sessionId}`, error);
                    }
                }
            }
        }, 30000); // Run every 30 seconds
    }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} rejected: No token`);
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            const userId = payload.user_id || payload.sub;
            if (!userId) {
                client.disconnect();
                return;
            }

            client.data.userId = userId;
            await client.join(`user_${userId}`);

            this.logger.log(`User ${userId} connected to video-dating`);

            // Send queue status
            client.emit('queue:status', {
                queueSize: this.videoDatingService.getQueueSize(),
                isInQueue: this.videoDatingService.isInQueue(userId),
            });
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            // Remove from queue
            this.videoDatingService.removeFromQueue(userId);

            // End any active session
            const sessionKey = this.userSessions.get(userId);
            if (sessionKey) {
                this.handleUserDisconnectFromSession(userId, sessionKey);
            }

            this.logger.log(`User ${userId} disconnected from video-dating`);
        }
    }

    @SubscribeMessage('queue:join')
    async handleJoinQueue(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: JoinQueueDto,
    ) {
        const userId = client.data.userId;
        if (!userId) return { ok: false, error: 'Not authenticated' };

        // Check if already in a session
        if (this.userSessions.has(userId)) {
            return { ok: false, error: 'Already in a video session' };
        }

        // Add to queue
        this.videoDatingService.addToQueue({
            userId,
            socketId: client.id,
            intentMode: dto.intentMode,
            genderPreference: dto.genderPreference || 'all',
            joinedAt: new Date(),
        });

        this.logger.log(`User ${userId} joined queue (${dto.intentMode})`);

        // Broadcast updated queue size to all connected clients
        this.broadcastQueueSize();

        // Try to find a match
        const match = this.videoDatingService.findMatch(userId);

        if (match) {
            await this.createVideoSession(userId, client.id, match.userId, match.socketId, dto.intentMode);
            // Broadcast again after match (queue size decreased)
            this.broadcastQueueSize();
        }

        return { ok: true, inQueue: true };
    }

    @SubscribeMessage('queue:leave')
    handleLeaveQueue(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            this.videoDatingService.removeFromQueue(userId);
            this.logger.log(`User ${userId} left queue`);
            // Broadcast updated queue size
            this.broadcastQueueSize();
        }
        return { ok: true };
    }

    @SubscribeMessage('call:offer')
    handleCallOffer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; offer: RTCSessionDescriptionInit },
    ) {
        const userId = client.data.userId;
        const session = this.activeSessions.get(data.sessionId);

        if (session) {
            // Forward offer to the other user
            const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
            this.server.to(targetSocketId).emit('call:offer', {
                sessionId: data.sessionId,
                offer: data.offer,
                fromUserId: userId,
            });
        }
    }

    @SubscribeMessage('call:answer')
    handleCallAnswer(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; answer: RTCSessionDescriptionInit },
    ) {
        const session = this.activeSessions.get(data.sessionId);

        if (session) {
            const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
            this.server.to(targetSocketId).emit('call:answer', {
                sessionId: data.sessionId,
                answer: data.answer,
            });
        }
    }

    @SubscribeMessage('call:ice-candidate')
    handleIceCandidate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sessionId: string; candidate: RTCIceCandidateInit },
    ) {
        const session = this.activeSessions.get(data.sessionId);

        if (session) {
            const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
            this.server.to(targetSocketId).emit('call:ice-candidate', {
                sessionId: data.sessionId,
                candidate: data.candidate,
            });
        }
    }

    @SubscribeMessage('call:next')
    async handleNextPartner(
        @ConnectedSocket() client: Socket,
        @MessageBody() data?: { intentMode?: string; genderPreference?: string },
    ) {
        const userId = client.data.userId;
        const sessionKey = this.userSessions.get(userId);

        // Store intent before cleanup
        let intentMode = 'DATE';
        let genderPreference = 'all';

        // Get existing queue entry if any
        const existingEntry = this.videoDatingService.getQueueEntry(userId);
        if (existingEntry) {
            intentMode = existingEntry.intentMode;
            genderPreference = existingEntry.genderPreference;
        }

        if (sessionKey) {
            const session = this.activeSessions.get(sessionKey);
            if (session) {
                // Notify other user
                const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
                this.server.to(targetSocketId).emit('call:ended', { reason: 'partner_skipped' });

                // End the session
                await this.videoDatingService.endSession(sessionKey);

                // Clean up
                this.cleanupSession(sessionKey);
            }
        }

        // Re-add user to queue
        this.videoDatingService.addToQueue({
            userId,
            socketId: client.id,
            intentMode: data?.intentMode || intentMode,
            genderPreference: data?.genderPreference || genderPreference,
            joinedAt: new Date(),
        });

        // Try to find a new match
        const match = this.videoDatingService.findMatch(userId);
        if (match) {
            await this.createVideoSession(userId, client.id, match.userId, match.socketId, intentMode);
        } else {
            // Notify user they're back in queue
            client.emit('queue:status', {
                queueSize: this.videoDatingService.getQueueSize(),
                isInQueue: true,
                searching: true,
            });
        }

        return { ok: true };
    }

    @SubscribeMessage('call:end')
    async handleEndCall(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        const sessionKey = this.userSessions.get(userId);

        if (sessionKey) {
            const session = this.activeSessions.get(sessionKey);
            if (session) {
                // Notify other user
                const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
                this.server.to(targetSocketId).emit('call:ended', { reason: 'partner_ended' });

                await this.videoDatingService.endSession(sessionKey);
                this.cleanupSession(sessionKey);
            }
        }

        // Remove from queue
        this.videoDatingService.removeFromQueue(userId);

        return { ok: true };
    }

    @SubscribeMessage('call:report')
    async handleReportPartner(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { reason: string },
    ) {
        const userId = client.data.userId;
        const sessionKey = this.userSessions.get(userId);

        if (sessionKey) {
            const session = this.activeSessions.get(sessionKey);
            if (session) {
                // Report the session
                await this.videoDatingService.reportSession(sessionKey);

                // End the call
                const targetSocketId = session.user1 === client.id ? session.user2 : session.user1;
                this.server.to(targetSocketId).emit('call:ended', { reason: 'reported' });

                this.cleanupSession(sessionKey);

                this.logger.warn(`User ${userId} reported session ${sessionKey}: ${data.reason}`);
            }
        }

        return { ok: true };
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎬 AI DATING HOST: New Socket Events
    // ═══════════════════════════════════════════════════════════════════

    /**
     * User requests a new topic manually
     */
    @SubscribeMessage('blind:request_topic')
    async handleRequestTopic(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) {
            return { ok: false, error: 'Not in a session' };
        }

        const blindSession = this.videoDatingService.getBlindSession(sessionId);
        const socketSession = this.activeSessions.get(sessionId);

        if (!blindSession || !socketSession) {
            return { ok: false, error: 'Session not found' };
        }

        try {
            const [profileA, profileB] = await Promise.all([
                this.profileRepo.findOne({ where: { user_id: blindSession.participants[0] } }),
                this.profileRepo.findOne({ where: { user_id: blindSession.participants[1] } }),
            ]);

            if (!profileA || !profileB) {
                return { ok: false, error: 'Profiles not found' };
            }

            const newTopic = await this.aiService.generateDateTopic(
                {
                    display_name: profileA.display_name,
                    occupation: profileA.occupation,
                    tags: profileA.tags as string[],
                    bio: profileA.bio,
                },
                {
                    display_name: profileB.display_name,
                    occupation: profileB.occupation,
                    tags: profileB.tags as string[],
                    bio: profileB.bio,
                },
                blindSession.topicHistory,
                false,
            );

            this.videoDatingService.addTopic(sessionId, newTopic);

            // Emit to both users
            const topicEvent = {
                sessionId,
                topic: newTopic,
                isRescue: false,
                topicNumber: blindSession.topicHistory.length,
                requestedBy: userId,
            };
            this.server.to(socketSession.user1).emit('blind:new_topic', topicEvent);
            this.server.to(socketSession.user2).emit('blind:new_topic', topicEvent);

            return { ok: true, topic: newTopic };
        } catch (error) {
            this.logger.error('Failed to generate requested topic', error);
            return { ok: false, error: 'Failed to generate topic' };
        }
    }

    /**
     * User is speaking (for activity tracking)
     */
    @SubscribeMessage('blind:activity')
    handleActivity(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        const sessionId = this.userSessions.get(userId);

        if (sessionId) {
            this.videoDatingService.updateActivity(sessionId);
        }

        return { ok: true };
    }

    /**
     * User wants to reveal early (mutual consent needed)
     */
    @SubscribeMessage('blind:request_reveal')
    async handleRequestReveal(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) {
            return { ok: false, error: 'Not in a session' };
        }

        const blindSession = this.videoDatingService.getBlindSession(sessionId);
        const socketSession = this.activeSessions.get(sessionId);

        if (!blindSession || !socketSession) {
            return { ok: false, error: 'Session not found' };
        }

        // Notify partner about reveal request
        const targetSocketId = socketSession.user1Id === userId ? socketSession.user2 : socketSession.user1;
        this.server.to(targetSocketId).emit('blind:reveal_requested', {
            sessionId,
            fromUserId: userId,
        });

        return { ok: true };
    }

    /**
     * User accepts reveal request
     */
    @SubscribeMessage('blind:accept_reveal')
    async handleAcceptReveal(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) {
            return { ok: false, error: 'Not in a session' };
        }

        const socketSession = this.activeSessions.get(sessionId);

        if (!socketSession) {
            return { ok: false, error: 'Session not found' };
        }

        // Set blur to 0 immediately
        this.videoDatingService.decreaseBlur(sessionId, 100); // Force to 0

        // Notify both users
        this.server.to(socketSession.user1).emit('blind:blur_update', {
            sessionId,
            blurLevel: 0,
            message: '🎉 MẶT ĐÃ LỘ DIỆN! Hai bạn đã đồng ý reveal!',
        });
        this.server.to(socketSession.user2).emit('blind:blur_update', {
            sessionId,
            blurLevel: 0,
            message: '🎉 MẶT ĐÃ LỘ DIỆN! Hai bạn đã đồng ý reveal!',
        });

        return { ok: true };
    }

    private async createVideoSession(
        user1Id: string,
        user1SocketId: string,
        user2Id: string,
        user2SocketId: string,
        intentMode: string,
    ) {
        // Remove both from queue
        this.videoDatingService.removeFromQueue(user1Id);
        this.videoDatingService.removeFromQueue(user2Id);

        // Create database session
        const session = await this.videoDatingService.createSession(user1Id, user2Id, intentMode);

        // Track session by sessionId (database UUID)
        this.activeSessions.set(session.id, {
            user1: user1SocketId,
            user2: user2SocketId,
            user1Id,
            user2Id,
        });
        this.userSessions.set(user1Id, session.id);
        this.userSessions.set(user2Id, session.id);

        // 🎬 AI DATING HOST: Generate intro and first topic
        let introMessage = 'Chào mừng đến với Peerzee Blind Date! 🎭';
        let initialTopic = 'Nếu có 1 tỷ đồng, bạn sẽ mở quán cafe hay đầu tư crypto?';

        try {
            const [profileA, profileB] = await Promise.all([
                this.profileRepo.findOne({ where: { user_id: user1Id } }),
                this.profileRepo.findOne({ where: { user_id: user2Id } }),
            ]);

            if (profileA && profileB) {
                // Generate personalized intro and topic in parallel
                const [intro, topic] = await Promise.all([
                    this.aiService.generateBlindDateIntro(
                        {
                            display_name: profileA.display_name,
                            occupation: profileA.occupation,
                            tags: profileA.tags as string[],
                            location: profileA.location,
                        },
                        {
                            display_name: profileB.display_name,
                            occupation: profileB.occupation,
                            tags: profileB.tags as string[],
                            location: profileB.location,
                        },
                    ),
                    this.aiService.generateDateTopic(
                        {
                            display_name: profileA.display_name,
                            occupation: profileA.occupation,
                            tags: profileA.tags as string[],
                            bio: profileA.bio,
                        },
                        {
                            display_name: profileB.display_name,
                            occupation: profileB.occupation,
                            tags: profileB.tags as string[],
                            bio: profileB.bio,
                        },
                        [],
                        false,
                    ),
                ]);
                introMessage = intro;
                initialTopic = topic;
            }
        } catch (error) {
            this.logger.error('Failed to generate AI intro/topic, using defaults', error);
        }

        // Initialize blind session state
        this.videoDatingService.initBlindSession(
            session.id,
            user1Id,
            user2Id,
            introMessage,
            initialTopic,
        );

        // Notify both users with blind date info
        const matchPayload = {
            sessionId: session.id,
            partnerId: user2Id,
            isInitiator: true,
            // 🎬 Blind Date specific
            blindDate: {
                introMessage,
                initialTopic,
                blurLevel: 20,
            },
        };

        this.server.to(user1SocketId).emit('match:found', {
            ...matchPayload,
            partnerId: user2Id,
            isInitiator: true,
        });

        this.server.to(user2SocketId).emit('match:found', {
            ...matchPayload,
            partnerId: user1Id,
            isInitiator: false,
        });

        this.logger.log(`🎬 Blind Date session created: ${user1Id} <-> ${user2Id} (blur: 20px)`);
    }

    private handleUserDisconnectFromSession(userId: string, sessionId: string) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            // Notify other user
            const otherUserId = userId === session.user1Id ? session.user2Id : session.user1Id;

            this.server.to(`user_${otherUserId}`).emit('call:ended', { reason: 'partner_disconnected' });

            // End session
            this.videoDatingService.endSession(sessionId);
            this.cleanupSession(sessionId);
        }
    }

    private cleanupSession(sessionId: string) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            this.userSessions.delete(session.user1Id);
            this.userSessions.delete(session.user2Id);
            this.activeSessions.delete(sessionId);
        }
    }

    /**
     * Broadcast current queue size to all connected clients
     */
    private broadcastQueueSize() {
        const queueSize = this.videoDatingService.getQueueSize();
        this.server.emit('queue:status', { queueSize });
    }
}
