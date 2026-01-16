import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

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

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: NotificationType,
        default: NotificationType.SYSTEM,
    })
    type: NotificationType;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'jsonb', default: '{}' })
    data: NotificationData;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
