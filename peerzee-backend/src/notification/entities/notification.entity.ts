import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    Enum,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { v4 as uuid } from 'uuid';

export enum NotificationType {
    MATCH = 'MATCH',
    LIKE_POST = 'LIKE_POST',
    COMMENT = 'COMMENT',
    SUPER_LIKE = 'SUPER_LIKE',
    MESSAGE = 'MESSAGE',
    SYSTEM = 'SYSTEM',
}

export interface NotificationData {
    postId?: string;
    matchId?: string;
    conversationId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    [key: string]: unknown;
}

@Entity({ tableName: 'notifications' })
export class Notification {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user_id' })
    user: User;

    @Enum(() => NotificationType)
    @Property({ default: NotificationType.SYSTEM })
    type: NotificationType = NotificationType.SYSTEM;

    @Property({ type: 'varchar', length: 255 })
    title: string;

    @Property({ type: 'text' })
    message: string;

    @Property({ type: 'jsonb' })
    data: NotificationData = {};

    @Property({ fieldName: 'is_read', type: 'boolean', default: false })
    isRead: boolean = false;

    @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
    createdAt: Date = new Date();
}
