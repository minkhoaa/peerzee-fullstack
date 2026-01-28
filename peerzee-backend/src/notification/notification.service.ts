import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Server } from 'socket.io';
import { Notification, NotificationType, NotificationData } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class NotificationService {
    private socketServer: Server | null = null;

    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepo: EntityRepository<Notification>,
        private readonly em: EntityManager,
    ) { }

    setSocketServer(server: Server) {
        this.socketServer = server;
    }

    async createAndEmit(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        data: NotificationData = {},
    ): Promise<Notification> {
        // Save to database
        const notification = new Notification();
        notification.user = this.em.getReference(User, userId);
        notification.type = type;
        notification.title = title;
        notification.message = message;
        notification.data = data;
        notification.isRead = false;
        await this.em.persistAndFlush(notification);

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

    async getNotifications(
        userId: string,
        cursor?: string,
        limit: number = 20,
    ): Promise<{
        notifications: Notification[];
        nextCursor: string | null;
        unreadCount: number;
    }> {
        let query: any = { userId };
        if (cursor) {
            const cursorDate = new Date(cursor);
            query.createdAt = { $lt: cursorDate };
        }

        const notifications = await this.notificationRepo.find(
            query,
            { orderBy: { createdAt: 'DESC' }, limit: limit + 1 }
        );

        // Get unread count
        const unreadCount = await this.notificationRepo.count({ user: { id: userId }, isRead: false });

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

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationRepo.count({ user: { id: userId }, isRead: false });
    }

    async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
        const notification = await this.notificationRepo.findOne({ id: notificationId, user: { id: userId } });

        if (!notification) return null;

        notification.isRead = true;
        await this.em.persistAndFlush(notification);
        return notification;
    }

    async markAllAsRead(userId: string): Promise<number> {
        const result = await this.notificationRepo.nativeUpdate(
            { user: { id: userId }, isRead: false },
            { isRead: true },
        );
        return result;
    }

    async deleteOldNotifications(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await this.notificationRepo.nativeDelete({
            createdAt: { $lt: cutoffDate },
            isRead: true,
        });

        return result;
    }
}
