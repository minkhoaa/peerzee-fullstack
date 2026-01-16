import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Server } from 'socket.io';
import { Notification, NotificationType, NotificationData } from './entities/notification.entity';

@Injectable()
export class NotificationService {
    private socketServer: Server | null = null;

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: Repository<Notification>,
    ) { }

    /**
     * Set the Socket.io server instance for emitting events
     */
    setSocketServer(server: Server) {
        this.socketServer = server;
    }

    /**
     * Create a notification and emit it to the user in real-time
     */
    async createAndEmit(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data: NotificationData = {},
    ): Promise<Notification> {
        // Save to database
        const notification = await this.notificationRepo.save({
            userId,
            type,
            title,
            message,
            data,
            isRead: false,
        });

        // Emit to user's room via Socket.io
        if (this.socketServer) {
            this.socketServer.to(userId).emit('new_notification', {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
            });
        }

        return notification;
    }

    /**
     * Get notifications for a user with cursor-based pagination
     */
    async getNotifications(
        userId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<{
        notifications: Notification[];
        nextCursor: string | null;
        unreadCount: number;
    }> {
        const queryBuilder = this.notificationRepo
            .createQueryBuilder('notification')
            .where('notification.user_id = :userId', { userId })
            .orderBy('notification.created_at', 'DESC')
            .take(limit + 1);

        if (cursor) {
            const cursorDate = new Date(cursor);
            queryBuilder.andWhere('notification.created_at < :cursor', { cursor: cursorDate });
        }

        const notifications = await queryBuilder.getMany();

        // Get unread count
        const unreadCount = await this.notificationRepo.count({
            where: { userId, isRead: false },
        });

        // Check if there are more items
        let nextCursor: string | null = null;
        if (notifications.length > limit) {
            notifications.pop();
            nextCursor = notifications[notifications.length - 1].createdAt.toISOString();
        }

        return {
            notifications,
            nextCursor,
            unreadCount,
        };
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepo.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark a specific notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
        const notification = await this.notificationRepo.findOne({
            where: { id: notificationId, userId },
        });

        if (!notification) return null;

        notification.isRead = true;
        return this.notificationRepo.save(notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
        const result = await this.notificationRepo.update(
            { userId, isRead: false },
            { isRead: true },
        );
        return result.affected || 0;
    }

    /**
     * Delete old notifications (cleanup job)
     */
    async deleteOldNotifications(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.notificationRepo.delete({
            createdAt: LessThan(cutoffDate),
            isRead: true,
        });

        return result.affected || 0;
    }
}
