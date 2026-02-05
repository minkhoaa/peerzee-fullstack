import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from '../../user/entities/user.entity';

export enum QuestType {
    SWIPE = 'SWIPE',
    CHAT = 'CHAT',
    COMMENT = 'COMMENT',
    POST = 'POST',
    LIKE_POST = 'LIKE_POST',
    PROFILE_UPDATE = 'PROFILE_UPDATE',
    DAILY_LOGIN = 'DAILY_LOGIN',
    MATCH = 'MATCH',
}

export enum QuestStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CLAIMED = 'CLAIMED',
    EXPIRED = 'EXPIRED',
}

// Quest template definitions
export interface QuestTemplate {
    id: string;
    title: string;
    description: string;
    type: QuestType;
    target: number;
    rewardXp: number;
    rewardCoins: number;
    icon: string;
    isDaily: boolean;
    isWeekly: boolean;
}

export const QUEST_TEMPLATES: QuestTemplate[] = [
    // Daily Quests
    {
        id: 'daily_login',
        title: 'Daily Check-in',
        description: 'Đăng nhập mỗi ngày',
        type: QuestType.DAILY_LOGIN,
        target: 1,
        rewardXp: 10,
        rewardCoins: 5,
        icon: '☀️',
        isDaily: true,
        isWeekly: false,
    },
    {
        id: 'swipe_explorer',
        title: 'The Explorer',
        description: 'Swipe 20 người',
        type: QuestType.SWIPE,
        target: 20,
        rewardXp: 30,
        rewardCoins: 15,
        icon: '🧭',
        isDaily: true,
        isWeekly: false,
    },
    {
        id: 'chat_starter',
        title: 'The Conversationalist',
        description: 'Gửi 10 tin nhắn',
        type: QuestType.CHAT,
        target: 10,
        rewardXp: 25,
        rewardCoins: 10,
        icon: '💬',
        isDaily: true,
        isWeekly: false,
    },
    // Weekly Quests
    {
        id: 'socialite',
        title: 'The Socialite',
        description: 'Bình luận 5 bài viết trong cộng đồng',
        type: QuestType.COMMENT,
        target: 5,
        rewardXp: 100,
        rewardCoins: 50,
        icon: '🌟',
        isDaily: false,
        isWeekly: true,
    },
    {
        id: 'matchmaker',
        title: 'Matchmaker',
        description: 'Đạt 3 matches mới',
        type: QuestType.MATCH,
        target: 3,
        rewardXp: 150,
        rewardCoins: 75,
        icon: '💘',
        isDaily: false,
        isWeekly: true,
    },
    {
        id: 'super_swiper',
        title: 'Super Swiper',
        description: 'Swipe 100 người trong tuần',
        type: QuestType.SWIPE,
        target: 100,
        rewardXp: 200,
        rewardCoins: 100,
        icon: '⚡',
        isDaily: false,
        isWeekly: true,
    },
    {
        id: 'community_contributor',
        title: 'Community Contributor',
        description: 'Đăng 2 bài viết trong cộng đồng',
        type: QuestType.POST,
        target: 2,
        rewardXp: 80,
        rewardCoins: 40,
        icon: '📝',
        isDaily: false,
        isWeekly: true,
    },
];

@Entity({ tableName: 'user_quests' })
export class UserQuest {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user_id' })
    user: User;

    @Property({ fieldName: 'quest_template_id' })
    questTemplateId: string;

    @Property({ default: 0 })
    progress: number = 0;

    @Property()
    target: number;

    @Enum(() => QuestStatus)
    status: QuestStatus = QuestStatus.ACTIVE;

    @Property({ fieldName: 'reward_xp' })
    rewardXp: number;

    @Property({ fieldName: 'reward_coins' })
    rewardCoins: number;

    @Property({ type: 'timestamp', fieldName: 'expires_at', nullable: true })
    expiresAt?: Date;

    @Property({ type: 'timestamp', fieldName: 'completed_at', nullable: true })
    completedAt?: Date;

    @Property({ type: 'timestamp', fieldName: 'claimed_at', nullable: true })
    claimedAt?: Date;

    @Property({ type: 'timestamp', fieldName: 'created_at' })
    createdAt: Date = new Date();
}
