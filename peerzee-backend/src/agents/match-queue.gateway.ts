import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AgentMatchQueueService, QueuedUser } from './agent-match-queue.service';

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    namespace: '/match-queue',
})
export class MatchQueueGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MatchQueueGateway.name);
    private userSockets: Map<string, string> = new Map(); // userId -> socketId
    private socketUsers: Map<string, string> = new Map(); // socketId -> userId (reverse lookup)
    private queueUpdateInterval: NodeJS.Timeout;

    constructor(private readonly queueService: AgentMatchQueueService) { }

    afterInit() {
        // Start queue update broadcast every 5 seconds
        this.queueUpdateInterval = setInterval(() => {
            this.broadcastQueueUpdates();
        }, 5000);

        this.logger.log('Match Queue Gateway initialized with 5s broadcast interval');
    }

    handleConnection(client: Socket) {
        this.logger.log(`✅ Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`❌ Client disconnected: ${client.id}`);

        // Find userId from socketId
        const userId = this.socketUsers.get(client.id);
        if (userId) {
            this.queueService.releaseFromMatch(userId);
            this.userSockets.delete(userId);
            this.socketUsers.delete(client.id);

            // Notify partner if in match
            const pair = this.queueService.getMatchPair(userId);
            if (pair) {
                this.emitPartnerDisconnected(pair.partnerId);
            }

            this.logger.log(`Cleaned up user ${userId}`);
        }
    }

    /**
     * Register user's socket ID
     */
    @SubscribeMessage('register')
    handleRegister(client: Socket, userId: string) {
        this.userSockets.set(userId, client.id);
        this.socketUsers.set(client.id, userId);
        this.logger.log(`✅ Registered user ${userId} with socket ${client.id}`);

        // Send immediate queue update
        const stats = this.queueService.getQueueStats(userId);
        if (stats.position > 0) {
            this.server.to(client.id).emit('QUEUE_UPDATE', stats);
        }
    }

    /**
     * Handle user cancelling search
     */
    @SubscribeMessage('match:cancel')
    handleCancel(client: Socket, userId: string) {
        this.queueService.removeFromQueue(userId);
        this.logger.log(`User ${userId} cancelled search`);
    }

    /**
     * Handle user accepting match (clicking Connect)
     */
    @SubscribeMessage('ACCEPT_MATCH')
    handleAcceptMatch(client: Socket, data: { userId: string; roomId: string }) {
        const { userId, roomId } = data;

        this.logger.log(`📨 ACCEPT_MATCH received from ${userId} for room ${roomId}`);
        this.logger.log(`Socket mapping for ${userId}: ${this.userSockets.get(userId)}`);

        const pair = this.queueService.getMatchPair(userId);

        if (!pair) {
            this.logger.warn(`⚠️ No match pair found for user ${userId}`);
            return;
        }

        this.logger.log(`✅ Found pair: ${userId} <-> ${pair.partnerId}`);
        this.logger.log(`Socket mapping for partner ${pair.partnerId}: ${this.userSockets.get(pair.partnerId)}`);

        // Send GO_TO_ROOM to both users
        this.logger.log(`🚀 Sending GO_TO_ROOM to ${userId}`);
        this.emitGoToRoom(userId, roomId);

        this.logger.log(`🚀 Sending GO_TO_ROOM to partner ${pair.partnerId}`);
        this.emitGoToRoom(pair.partnerId, roomId);

        // Clean up queue after navigation
        setTimeout(() => {
            this.queueService.removeFromQueue(userId);
            this.queueService.removeFromQueue(pair.partnerId);
        }, 1000);
    }

    /**
     * Handle user clicking Reroll
     */
    @SubscribeMessage('REROLL')
    handleReroll(client: Socket, userId: string) {
        const pair = this.queueService.getMatchPair(userId);

        if (pair) {
            this.logger.log(`User ${userId} rerolled. Releasing partner ${pair.partnerId}`);

            // Notify partner first
            this.emitPartnerDisconnected(pair.partnerId);

            // Release both users
            this.queueService.releaseFromMatch(userId);
        }

        // Remove from queue
        this.queueService.removeFromQueue(userId);
    }

    /**
     * Broadcast queue updates to all waiting users
     */
    private broadcastQueueUpdates() {
        const waitingUsers = this.queueService.getWaitingUsers();

        for (const user of waitingUsers) {
            const socketId = this.userSockets.get(user.userId);
            if (socketId) {
                const stats = this.queueService.getQueueStats(user.userId);
                this.server.to(socketId).emit('QUEUE_UPDATE', {
                    myPosition: stats.position,
                    totalInQueue: stats.total,
                    estimatedWait: stats.estimatedWait,
                });
            }
        }
    }

    /**
     * Emit match proposed to both users
     */
    emitMatchProposed(
        userA: QueuedUser,
        userB: QueuedUser,
        roomId: string,
        reasoning: string
    ) {
        const socketA = this.userSockets.get(userA.userId);
        const socketB = this.userSockets.get(userB.userId);

        this.logger.log(`🎉 Emitting MATCH_PROPOSED to both users`);
        this.logger.log(`User A: ${userA.userId}, Socket: ${socketA || 'NOT FOUND'}`);
        this.logger.log(`User B: ${userB.userId}, Socket: ${socketB || 'NOT FOUND'}`);

        // To User A (RECEIVER - was waiting in queue)
        if (socketA) {
            this.server.to(socketA).emit('MATCH_PROPOSED', {
                role: 'RECEIVER',
                partner: {
                    id: userB.userId,
                    display_name: `User_${userB.userId.substring(0, 8)}`,
                    query: userB.query,
                },
                reasoning: 'Someone matched your search! 🎉',
                roomId,
            });
            this.logger.log(`✅ Sent MATCH_PROPOSED to ${userA.userId} (RECEIVER)`);
        } else {
            this.logger.error(`❌ Socket not found for User A: ${userA.userId}`);
        }

        // To User B (INITIATOR - just searched)
        if (socketB) {
            this.server.to(socketB).emit('MATCH_PROPOSED', {
                role: 'INITIATOR',
                partner: {
                    id: userA.userId,
                    display_name: `User_${userA.userId.substring(0, 8)}`,
                    query: userA.query,
                },
                reasoning,
                roomId,
            });
            this.logger.log(`✅ Sent MATCH_PROPOSED to ${userB.userId} (INITIATOR)`);
        } else {
            this.logger.error(`❌ Socket not found for User B: ${userB.userId}`);
        }
    }

    /**
     * Emit GO_TO_ROOM to a specific user
     */
    emitGoToRoom(userId: string, roomId: string) {
        const socketId = this.userSockets.get(userId);

        this.logger.log(`🎯 Emitting GO_TO_ROOM to ${userId}, socketId: ${socketId}`);

        if (socketId) {
            this.server.to(socketId).emit('GO_TO_ROOM', {
                roomId,
                mode: 'video',
                url: `/match?session=${roomId}&mode=video`,
            });
            this.logger.log(`✅ Sent GO_TO_ROOM to ${userId} (socket: ${socketId})`);
        } else {
            this.logger.error(`❌ Cannot send GO_TO_ROOM: Socket not found for user ${userId}`);
            this.logger.log(`Current socket mappings:`, Array.from(this.userSockets.entries()));
        }
    }

    /**
     * Notify user that partner disconnected
     */
    private emitPartnerDisconnected(userId: string) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('PARTNER_DISCONNECTED', {
                message: 'Partner disconnected. Searching again...',
            });
            this.logger.log(`Sent PARTNER_DISCONNECTED to ${userId}`);
        }
    }

    /**
     * Emit waiting status (legacy - now handled by QUEUE_UPDATE)
     */
    emitWaiting(userId: string, position: number, totalInQueue: number) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.server.to(socketId).emit('QUEUE_UPDATE', {
                myPosition: position,
                totalInQueue,
                estimatedWait: position === 1 ? '< 1 min' : `${position} mins`,
            });
        }
    }

    /**
     * Legacy match found emit
     */
    emitMatchFound(userId: string, matchData: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            const sessionId = `match_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            this.server.to(socketId).emit('match:found', {
                ...matchData,
                sessionId,
                redirectUrl: `/match?session=${sessionId}&mode=video`,
            });
            this.logger.log(`Match notification sent to user ${userId} with session ${sessionId}`);
        }
    }
}
