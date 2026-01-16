import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

export interface MatchNotification {
    matchId: string;
    conversationId: string;
    partnerProfile: {
        id: string;
        display_name: string;
        email: string;
    };
}

@WebSocketGateway({
    namespace: '/matching',
    cors: {
        origin: '*',
        credentials: true,
    },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(MatchGateway.name);

    constructor(private readonly jwtService: JwtService) { }

    /**
     * Handle new WebSocket connections
     * Authenticate via JWT and join user-specific room
     */
    async handleConnection(client: Socket) {
        try {
            // Extract token from handshake
            const token =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Client ${client.id} connection rejected: No token`);
                client.disconnect();
                return;
            }

            // Verify JWT
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_SECRET,
            });

            const userId = payload.user_id || payload.sub;

            if (!userId) {
                this.logger.warn(`Client ${client.id} connection rejected: Invalid token`);
                client.disconnect();
                return;
            }

            // Attach user info to socket
            client.data.userId = userId;

            // Join user-specific room for private notifications
            const userRoom = `user_${userId}`;
            await client.join(userRoom);

            this.logger.log(`User ${userId} connected to matching (socket: ${client.id})`);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    /**
     * Handle WebSocket disconnections
     */
    handleDisconnect(client: Socket) {
        const userId = client.data?.userId;
        if (userId) {
            this.logger.log(`User ${userId} disconnected from matching`);
        }
    }

    /**
     * Emit match notification to both matched users
     */
    emitMatchFound(user1Id: string, user2Id: string, notification1: MatchNotification, notification2: MatchNotification) {
        // Send to user1
        this.server.to(`user_${user1Id}`).emit('match_found', notification1);
        this.logger.log(`Match notification sent to user ${user1Id}`);

        // Send to user2
        this.server.to(`user_${user2Id}`).emit('match_found', notification2);
        this.logger.log(`Match notification sent to user ${user2Id}`);
    }

    /**
     * Handle client ping (for connection health check)
     */
    @SubscribeMessage('ping')
    handlePing(client: Socket) {
        return { event: 'pong', data: { timestamp: Date.now() } };
    }
}
