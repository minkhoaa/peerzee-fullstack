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
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { VideoDatingService } from './video-dating.service';
import { TranslationService } from './translation.service';
import { TopicGeneratorService } from './topic-generator.service';
import { JoinQueueDto } from './dto/join-queue.dto';
import { AiService } from '../ai/ai.service';
import { UserProfile } from '../user/entities/user-profile.entity';
import { MatchWorkflow } from '../agents/workflow';

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
        private readonly translationService: TranslationService,
        private readonly topicGenerator: TopicGeneratorService,
        private readonly aiService: AiService,
        private readonly matchWorkflow: MatchWorkflow,
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
        private readonly em: EntityManager,
    ) { }

    /**
     * 🎬 AI DATING HOST: Initialize Game Loop when Gateway starts
     */
    afterInit() {
        this.logger.log('🎬 VideoDatingGateway initialized - Starting AI Host Game Loop');
        this.startGameLoop();
    }

    /**
     * 🤖 Build rich profile text for embedding generation
     */
    private buildProfileText(profile: UserProfile): string {
        const parts: string[] = [];

        if (profile.bio) parts.push(profile.bio);
        if (profile.occupation) parts.push(`Works as ${profile.occupation}`);
        if (profile.education) parts.push(`Studies at ${profile.education}`);
        if (profile.tags && profile.tags.length > 0) {
            parts.push(`Interests: ${profile.tags.join(', ')}`);
        }
        if (profile.prompts && profile.prompts.length > 0) {
            profile.prompts.forEach(p => {
                parts.push(`${p.question}: ${p.answer}`);
            });
        }
        if (profile.spotify?.song) {
            parts.push(`Favorite music: ${profile.spotify.song} by ${profile.spotify.artist}`);
        }
        if (profile.intentMode) {
            parts.push(`Looking for: ${profile.intentMode.toLowerCase()}`);
        }

        return parts.join('. ');
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
                        const em = this.em.fork();
                        const profileRepo = em.getRepository(UserProfile);
                        const [profileA, profileB] = await Promise.all([
                            profileRepo.findOne({ user: { id: blindSession.participants[0] } }),
                            profileRepo.findOne({ user: { id: blindSession.participants[1] } }),
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

        // 🤖 AI MATCHING: Fetch profile and generate embedding
        const em = this.em.fork();
        const profileRepo = em.getRepository(UserProfile);
        const profile = await profileRepo.findOne({ user: { id: userId } });

        let embedding: number[] | undefined;
        if (profile) {
            // Generate embedding from profile content
            const profileText = this.buildProfileText(profile);
            try {
                embedding = await this.aiService.generateEmbedding(profileText);
                this.logger.debug(`Generated embedding for user ${userId} (${embedding.length} dimensions)`);
            } catch (error) {
                this.logger.error(`Failed to generate embedding for ${userId}:`, error);
            }
        }

        // Add to queue with AI data
        this.videoDatingService.addToQueue({
            userId,
            socketId: client.id,
            intentMode: dto.intentMode,
            genderPreference: dto.genderPreference || 'all',
            gender: profile?.gender,
            displayName: profile?.display_name,
            embedding,
            bio: profile?.bio,
            tags: profile?.tags,
            age: profile?.age,
            latitude: profile?.latitude,
            longitude: profile?.longitude,
            joinedAt: new Date(),
        });

        this.logger.log(`User ${userId} joined queue (intentMode=${dto.intentMode}, matchingType=${dto.matchingType || 'semantic'}, hasEmbedding=${!!embedding}, query=${dto.query || 'none'})`);

        // 🤖 RAG AGENT SEARCH: If query provided, run RAG workflow
        if (dto.query && dto.query.trim()) {
            this.logger.log(`🎯 RAG Agent Search: "${dto.query}"`);
            try {
                const ragResult = await this.matchWorkflow.runWorkflow(dto.query, userId);

                if (ragResult.finalMatch) {
                    const targetUserId = ragResult.finalMatch.profile.id;
                    this.logger.log(`✅ RAG found match: ${targetUserId}`);

                    // SAFETY: Check if CURRENT user is still in queue after await
                    if (!this.videoDatingService.isInQueue(userId)) {
                        this.logger.log(`User ${userId} was already matched while awaiting RAG. Stopping...`);
                        return { ok: true, matched: true };
                    }

                    // Check if target user is in queue
                    const targetInQueue = this.videoDatingService.getQueueEntry(targetUserId);

                    if (targetInQueue) {
                        this.logger.log(`🎉 Target user ${targetUserId} is in queue! Creating session...`);
                        // Match with target user
                        await this.createVideoSession(userId, client.id, targetInQueue.userId, targetInQueue.socketId, dto.intentMode);
                        this.broadcastQueueSize();
                        return { ok: true, matched: true };
                    } else {
                        this.logger.log(`⏳ Target user ${targetUserId} not in queue, falling back to regular matching`);
                    }
                } else {
                    this.logger.warn('RAG agent found no match, falling back to regular matching');
                }
            } catch (error) {
                this.logger.error('RAG agent search failed, falling back to regular matching:', error);
            }
        }

        // Broadcast updated queue size to all connected clients
        this.broadcastQueueSize();

        // 🛡️ SAFETY CHECK: Is user still in queue after any awaits above?
        if (!this.videoDatingService.isInQueue(userId)) {
            this.logger.log(`User ${userId} already matched by someone else during initial phase.`);
            return { ok: true, matched: true };
        }

        // Try to find match based on matching type
        const useSemantic = dto.matchingType !== 'normal';
        this.logger.debug(`🤖 Attempting ${useSemantic ? 'AI semantic' : 'simple'} match for user ${userId}...`);

        const match = useSemantic
            ? this.videoDatingService.findMatch(userId)
            : this.videoDatingService.findSimpleMatch(userId);

        if (match) {
            this.logger.log(`Match found! Creating session between ${userId} and ${match.userId} (${useSemantic ? 'semantic' : 'normal'})`);
            await this.createVideoSession(userId, client.id, match.userId, match.socketId, dto.intentMode);
            // Broadcast again after match (queue size decreased)
            this.broadcastQueueSize();
        } else {
            this.logger.debug(`No match found for user ${userId}, staying in queue`);
        }

        return { ok: true, inQueue: true };
    }

    @SubscribeMessage('room:join')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string, intentMode?: string },
    ) {
        const userId = client.data.userId;
        if (!userId) return { ok: false, error: 'Not authenticated' };

        const { roomId, intentMode = 'DATE' } = data;
        this.logger.log(`📥 User ${userId} joining specific room: ${roomId}`);

        // Track users waiting for this specific room
        let session = this.activeSessions.get(roomId);

        if (!session) {
            // First user to arrive
            this.activeSessions.set(roomId, {
                user1: client.id,
                user1Id: userId,
                user2: '',
                user2Id: '',
            });
            this.userSessions.set(userId, roomId);
            this.logger.log(`⏳ User ${userId} waiting for partner in room ${roomId}`);
            return { ok: true, waiting: true };
        } else if (session.user1Id !== userId && !session.user2Id) {
            // Second user arrives
            session.user2 = client.id;
            session.user2Id = userId;
            this.userSessions.set(userId, roomId);

            this.logger.log(`🎉 Room ${roomId} complete: ${session.user1Id} <-> ${session.user2Id}`);

            // Initialize blind session state
            const defaultIntro = 'Chào mừng đến với Peerzee! Agent đã kết nối hai bạn! 👋';
            const defaultTopic = 'Hãy bắt đầu bằng việc chào hỏi nhau nhé! 😊';

            this.videoDatingService.initBlindSession(
                roomId,
                session.user1Id,
                session.user2Id,
                defaultIntro,
                defaultTopic,
            );

            const matchPayload = {
                sessionId: roomId,
                blindDate: {
                    introMessage: defaultIntro,
                    initialTopic: defaultTopic,
                    blurLevel: 20,
                },
            };

            // Emit match:found to both
            this.server.to(session.user1).emit('match:found', {
                ...matchPayload,
                partnerId: session.user2Id,
                isInitiator: true,
            });

            this.server.to(session.user2).emit('match:found', {
                ...matchPayload,
                partnerId: session.user1Id,
                isInitiator: false,
            });

            return { ok: true, matched: true };
        }

        return { ok: false, error: 'Room already full or already joined' };
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
            const em = this.em.fork();
            const profileRepo = em.getRepository(UserProfile);
            const [profileA, profileB] = await Promise.all([
                profileRepo.findOne({ user: { id: blindSession.participants[0] } }),
                profileRepo.findOne({ user: { id: blindSession.participants[1] } }),
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
    @SubscribeMessage('chat:message')
    handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { message: string },
    ) {
        const userId = client.data.userId;
        this.logger.debug(`[CHAT] Received message from user ${userId}: "${data.message}"`);

        if (!userId) {
            this.logger.error('[CHAT] User not authenticated');
            return { ok: false, error: 'Not authenticated' };
        }

        const sessionId = this.userSessions.get(userId);
        if (!sessionId) {
            this.logger.error(`[CHAT] User ${userId} not in a session`);
            return { ok: false, error: 'Not in a session' };
        }

        const session = this.activeSessions.get(sessionId);
        if (!session) {
            this.logger.error(`[CHAT] Session ${sessionId} not found in activeSessions`);
            return { ok: false, error: 'Session not found' };
        }

        // Determine partner socket
        const partnerSocketId = session.user1Id === userId ? session.user2 : session.user1;
        const partnerId = session.user1Id === userId ? session.user2Id : session.user1Id;

        this.logger.log(`[CHAT] Forwarding message from ${userId} to partner ${partnerId} (socket: ${partnerSocketId})`);

        // Broadcast message to partner
        this.server.to(partnerSocketId).emit('chat:message', {
            sender: 'stranger',
            content: data.message,
            timestamp: new Date(),
        });

        // Update last activity for blind session
        const blindSession = this.videoDatingService.getBlindSession(sessionId);
        if (blindSession) {
            this.videoDatingService.updateActivity(sessionId);
        }

        return { ok: true };
    }

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

        // 🌍 Start AI features for this session
        this.topicGenerator.startTracking(session.id);
        this.logger.log(`🤖 AI features initialized for session ${session.id}`);

        // 🚀 OPTIMIZATION: Send match notification immediately with default messages
        // Initialize blind session with placeholders
        const defaultIntro = 'Chào mừng đến với Peerzee! Hãy bắt đầu trò chuyện! 👋';
        const defaultTopic = 'Hãy giới thiệu về bản thân bạn đi! 😊';

        this.videoDatingService.initBlindSession(
            session.id,
            user1Id,
            user2Id,
            defaultIntro,
            defaultTopic,
        );

        // Emit match event immediately so WebRTC can start
        const matchPayload = {
            sessionId: session.id,
            blindDate: {
                introMessage: defaultIntro,
                initialTopic: defaultTopic,
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

        this.logger.log(`🎬 Match created: ${user1Id} <-> ${user2Id} (instant match notification sent)`);

        // 🎬 Generate AI content in background (non-blocking)
        this.generateAIContentAsync(session.id, user1Id, user2Id, user1SocketId, user2SocketId).catch(err => {
            this.logger.error(`Failed to generate AI content for session ${session.id}:`, err);
        });
    }

    /**
     * Generate personalized AI intro and topic in background
     * Updates users when ready
     */
    private async generateAIContentAsync(
        sessionId: string,
        user1Id: string,
        user2Id: string,
        user1SocketId: string,
        user2SocketId: string,
    ) {
        try {
            const em = this.em.fork();
            const profileRepo = em.getRepository(UserProfile);
            const [profileA, profileB] = await Promise.all([
                profileRepo.findOne({ user: { id: user1Id } }),
                profileRepo.findOne({ user: { id: user2Id } }),
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

                // Update blind session with personalized content
                const blindSession = this.videoDatingService.getBlindSession(sessionId);
                if (blindSession) {
                    blindSession.introMessage = intro;
                    blindSession.currentTopic = topic;
                    blindSession.topicHistory = [topic];

                    // Notify users with personalized content
                    this.server.to(user1SocketId).emit('blind:content_updated', {
                        sessionId,
                        introMessage: intro,
                        currentTopic: topic,
                    });
                    this.server.to(user2SocketId).emit('blind:content_updated', {
                        sessionId,
                        introMessage: intro,
                        currentTopic: topic,
                    });

                    this.logger.log(`✨ AI content generated for session ${sessionId}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to generate AI content:`, error);
            // Users already have default content, so matching still works
        }
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
            
            // Stop translation and topic tracking
            this.translationService.stopTranslation(sessionId, session.user1Id);
            this.translationService.stopTranslation(sessionId, session.user2Id);
            this.topicGenerator.stopTracking(sessionId);
        }
    }

    // =====================================================
    // 🌍 AI TRANSLATION HANDLERS
    // =====================================================

    /**
     * Enable translation for the call
     */
    @SubscribeMessage('translation:enable')
    async handleEnableTranslation(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { sourceLanguage: string; targetLanguage: string },
    ) {
        const userId = (client as any).userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) {
            return { error: 'Not in a call' };
        }

        await this.translationService.startTranslation(
            sessionId,
            userId,
            data.sourceLanguage,
            data.targetLanguage,
        );

        this.logger.log(`Translation enabled: ${data.sourceLanguage} → ${data.targetLanguage} for user ${userId}`);
        return { success: true };
    }

    /**
     * Process audio chunk for translation
     */
    @SubscribeMessage('translation:audio')
    async handleTranslationAudio(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { audio: Buffer; sourceLanguage: string; targetLanguage: string },
    ) {
        const userId = (client as any).userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) return;

        // Transcribe audio
        const text = await this.translationService.processAudioChunk(
            sessionId,
            userId,
            data.audio,
        );

        if (!text) return; // Not enough audio yet

        // Record activity (speaking detected)
        this.topicGenerator.recordActivity(sessionId);

        // Translate
        const translation = await this.translationService.translate(
            text,
            data.sourceLanguage,
            data.targetLanguage,
        );

        if (translation) {
            // Send to other user
            const session = this.activeSessions.get(sessionId);
            if (session) {
                const otherUserId = userId === session.user1Id ? session.user2Id : session.user1Id;
                const otherSocketId = userId === session.user1Id ? session.user2 : session.user1;

                this.server.to(otherSocketId).emit('translation:subtitle', {
                    text: translation.translatedText,
                    originalText: translation.originalText,
                    sourceLanguage: translation.sourceLanguage,
                    targetLanguage: translation.targetLanguage,
                });
            }
        }
    }

    /**
     * Disable translation
     */
    @SubscribeMessage('translation:disable')
    async handleDisableTranslation(@ConnectedSocket() client: Socket) {
        const userId = (client as any).userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) return;

        await this.translationService.stopTranslation(sessionId, userId);
        return { success: true };
    }

    // =====================================================
    // 💬 AI TOPIC GENERATOR HANDLERS
    // =====================================================

    /**
     * Record activity (speaking, laughing, etc.)
     */
    @SubscribeMessage('activity:record')
    handleRecordActivity(@ConnectedSocket() client: Socket) {
        const userId = (client as any).userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) return;

        this.topicGenerator.recordActivity(sessionId);
    }

    /**
     * Check for silence and get topic suggestions
     * Called periodically by frontend
     */
    @SubscribeMessage('topics:check')
    async handleCheckTopics(@ConnectedSocket() client: Socket) {
        const userId = (client as any).userId;
        const sessionId = this.userSessions.get(userId);

        if (!sessionId) return { shouldSuggest: false };

        const session = this.activeSessions.get(sessionId);
        if (!session) return { shouldSuggest: false };

        const result = await this.topicGenerator.checkSilence(
            sessionId,
            session.user1Id,
            session.user2Id,
        );

        if (result.shouldSuggest && result.suggestions) {
            // Broadcast to both users
            this.server.to(session.user1).emit('topics:suggest', {
                suggestions: result.suggestions,
                silenceDuration: result.silenceDuration,
            });
            this.server.to(session.user2).emit('topics:suggest', {
                suggestions: result.suggestions,
                silenceDuration: result.silenceDuration,
            });
        }

        return result;
    }

    // =====================================================
    // 💬 REAL-TIME SUBTITLES (Web Speech API relay)
    // =====================================================

    /**
     * Client emits speech-to-text results; server relays them to the partner.
     *
     * Payload: { text: string; isFinal: boolean; sessionId?: string }
     * Emits to partner: 'subtitle:receive' { text, isFinal, userId }
     */
    @SubscribeMessage('subtitle:send')
    handleSubtitleSend(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { text: string; isFinal: boolean },
    ) {
        const userId = client.data.userId as string;
        const sessionId = this.userSessions.get(userId);
        if (!sessionId) return;

        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        const targetSocketId =
            session.user1 === client.id ? session.user2 : session.user1;

        this.server.to(targetSocketId).emit('subtitle:receive', {
            text: data.text,
            isFinal: data.isFinal,
            userId,
        });
    }

    /**
     * Broadcast current queue size to all connected clients
     */
    private broadcastQueueSize() {
        const queueSize = this.videoDatingService.getQueueSize();
        this.server.emit('queue:status', { queueSize });
    }
}
