import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { VideoDatingService } from './video-dating.service';
import { JoinQueueDto } from './dto/join-queue.dto';

@WebSocketGateway({
    namespace: '/video-dating',
    cors: {
        origin: '*',
        credentials: true,
    },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class VideoDatingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(VideoDatingGateway.name);

    // Track active video sessions: sessionId -> { user1SocketId, user2SocketId }
    private activeSessions: Map<string, { user1: string; user2: string; user1Id: string; user2Id: string }> = new Map();
    // Track user -> current sessionId
    private userSessions: Map<string, string> = new Map();

    constructor(
        private readonly jwtService: JwtService,
        private readonly videoDatingService: VideoDatingService,
    ) { }

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

        // Try to find a match
        const match = this.videoDatingService.findMatch(userId);

        if (match) {
            await this.createVideoSession(userId, client.id, match.userId, match.socketId, dto.intentMode);
        }

        return { ok: true, inQueue: true };
    }

    @SubscribeMessage('queue:leave')
    handleLeaveQueue(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            this.videoDatingService.removeFromQueue(userId);
            this.logger.log(`User ${userId} left queue`);
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

        // Notify both users
        this.server.to(user1SocketId).emit('match:found', {
            sessionId: session.id,
            partnerId: user2Id,
            isInitiator: true, // User1 creates the offer
        });

        this.server.to(user2SocketId).emit('match:found', {
            sessionId: session.id,
            partnerId: user1Id,
            isInitiator: false, // User2 waits for offer
        });

        this.logger.log(`Video session created: ${user1Id} <-> ${user2Id}`);
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
        }
        this.activeSessions.delete(sessionId);
    }
}
