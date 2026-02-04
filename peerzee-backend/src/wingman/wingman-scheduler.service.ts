import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

export type ProactiveTrigger =
    | 'inactive_3_days'
    | 'new_likes'
    | 'profile_incomplete'
    | 'match_no_message'
    | 'weekly_summary';

interface InactiveUserData {
    userId: string;
    displayName: string;
    lastActiveAt: Date;
    newLikesCount: number;
}

interface MatchNoMessageData {
    userId: string;
    matchUserId: string;
    matchDisplayName: string;
    matchedAt: Date;
}

/**
 * WingmanSchedulerService - Proactive notifications via cron jobs
 * Sends helpful tips and nudges to users to improve engagement
 */
@Injectable()
export class WingmanSchedulerService {
    private readonly logger = new Logger(WingmanSchedulerService.name);
    private readonly genAI: GoogleGenerativeAI;

    constructor(
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
        private readonly notificationService: NotificationService,
        private readonly em: EntityManager,
    ) {
        const apiKey = process.env.GEMINI_API_KEY;
        this.genAI = new GoogleGenerativeAI(apiKey || '');
    }

    /**
     * Daily check at 10:00 AM for inactive users
     */
    @Cron('0 10 * * *')
    async checkInactiveUsers() {
        this.logger.log('Running inactive users check...');
        
        try {
            // Find users inactive for 3+ days
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            const inactiveUsers = await this.em.getConnection().execute<InactiveUserData[]>(`
                SELECT 
                    u.id as "userId",
                    COALESCE(p.display_name, u.email) as "displayName",
                    u.last_active_at as "lastActiveAt",
                    COALESCE(likes.count, 0)::int as "newLikesCount"
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                LEFT JOIN (
                    SELECT target_id, COUNT(*) as count 
                    FROM user_swipes 
                    WHERE action = 'LIKE' 
                    AND created_at > NOW() - INTERVAL '7 days'
                    GROUP BY target_id
                ) likes ON likes.target_id = u.id
                WHERE u.last_active_at < $1
                AND u.last_active_at IS NOT NULL
                LIMIT 50
            `, [threeDaysAgo]);

            this.logger.log(`Found ${inactiveUsers.length} inactive users`);

            for (const user of inactiveUsers) {
                const message = await this.generateProactiveMessage(user.userId, 'inactive_3_days', {
                    newLikesCount: user.newLikesCount,
                    displayName: user.displayName,
                });

                await this.notificationService.createAndEmit(
                    user.userId,
                    NotificationType.SYSTEM,
                    '🤖 Cupid nhắc nhẹ',
                    message,
                    { source: 'wingman_proactive', trigger: 'inactive_3_days' },
                );
            }
        } catch (error) {
            this.logger.error('Failed to check inactive users:', error);
        }
    }

    /**
     * Daily check at 8:00 PM for new likes
     */
    @Cron('0 20 * * *')
    async notifyNewLikes() {
        this.logger.log('Running new likes notification...');
        
        try {
            // Find users with new likes in the last 24 hours
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const usersWithLikes = await this.em.getConnection().execute<{ userId: string; likeCount: number }[]>(`
                SELECT 
                    target_id as "userId",
                    COUNT(*)::int as "likeCount"
                FROM user_swipes
                WHERE action = 'LIKE'
                AND created_at > $1
                AND target_id NOT IN (
                    -- Exclude if already matched (mutual like)
                    SELECT s2.user_id FROM user_swipes s2 
                    WHERE s2.target_id = user_swipes.user_id 
                    AND s2.action = 'LIKE'
                )
                GROUP BY target_id
                HAVING COUNT(*) > 0
                LIMIT 100
            `, [oneDayAgo]);

            this.logger.log(`Found ${usersWithLikes.length} users with new likes`);

            for (const user of usersWithLikes) {
                const message = await this.generateProactiveMessage(user.userId, 'new_likes', {
                    likeCount: user.likeCount,
                });

                await this.notificationService.createAndEmit(
                    user.userId,
                    NotificationType.SYSTEM,
                    '💕 Ai đó thích bạn!',
                    message,
                    { source: 'wingman_proactive', trigger: 'new_likes', likeCount: user.likeCount },
                );
            }
        } catch (error) {
            this.logger.error('Failed to notify new likes:', error);
        }
    }

    /**
     * Every 2 hours: Check for matches without messages
     */
    @Cron('0 */2 * * *')
    async checkMatchNoMessage() {
        this.logger.log('Running match-no-message check...');
        
        try {
            // Find matches from 1-24 hours ago with no messages
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const matchesNoMessage = await this.em.getConnection().execute<MatchNoMessageData[]>(`
                SELECT DISTINCT
                    s1.user_id as "userId",
                    s1.target_id as "matchUserId",
                    COALESCE(p.display_name, 'Match') as "matchDisplayName",
                    GREATEST(s1.created_at, s2.created_at) as "matchedAt"
                FROM user_swipes s1
                INNER JOIN user_swipes s2 ON s1.user_id = s2.target_id AND s1.target_id = s2.user_id
                LEFT JOIN user_profiles p ON p.user_id = s1.target_id
                LEFT JOIN conversations c ON 
                    (c.user1_id = s1.user_id AND c.user2_id = s1.target_id) OR
                    (c.user1_id = s1.target_id AND c.user2_id = s1.user_id)
                WHERE s1.action = 'LIKE' AND s2.action = 'LIKE'
                AND GREATEST(s1.created_at, s2.created_at) BETWEEN $1 AND $2
                AND c.id IS NULL
                LIMIT 50
            `, [oneDayAgo, oneHourAgo]);

            this.logger.log(`Found ${matchesNoMessage.length} matches without messages`);

            for (const match of matchesNoMessage) {
                const message = await this.generateProactiveMessage(match.userId, 'match_no_message', {
                    matchDisplayName: match.matchDisplayName,
                });

                await this.notificationService.createAndEmit(
                    match.userId,
                    NotificationType.SYSTEM,
                    '💬 Đừng để match chờ!',
                    message,
                    { 
                        source: 'wingman_proactive', 
                        trigger: 'match_no_message',
                        matchUserId: match.matchUserId,
                    },
                );
            }
        } catch (error) {
            this.logger.error('Failed to check match-no-message:', error);
        }
    }

    /**
     * Weekly summary every Monday at 9:00 AM
     */
    @Cron('0 9 * * 1')
    async sendWeeklySummary() {
        this.logger.log('Running weekly summary...');
        
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            // Get weekly stats for active users
            const userStats = await this.em.getConnection().execute<{
                userId: string;
                likesReceived: number;
                matchesCount: number;
                messagesReceived: number;
            }[]>(`
                SELECT 
                    u.id as "userId",
                    COALESCE(likes.count, 0)::int as "likesReceived",
                    COALESCE(matches.count, 0)::int as "matchesCount",
                    COALESCE(msgs.count, 0)::int as "messagesReceived"
                FROM users u
                LEFT JOIN (
                    SELECT target_id, COUNT(*) as count 
                    FROM user_swipes 
                    WHERE action = 'LIKE' AND created_at > $1
                    GROUP BY target_id
                ) likes ON likes.target_id = u.id
                LEFT JOIN (
                    SELECT s1.user_id, COUNT(*) as count
                    FROM user_swipes s1
                    INNER JOIN user_swipes s2 ON s1.user_id = s2.target_id AND s1.target_id = s2.user_id
                    WHERE s1.action = 'LIKE' AND s2.action = 'LIKE' AND s1.created_at > $1
                    GROUP BY s1.user_id
                ) matches ON matches.user_id = u.id
                LEFT JOIN (
                    SELECT receiver_id, COUNT(*) as count
                    FROM messages
                    WHERE created_at > $1
                    GROUP BY receiver_id
                ) msgs ON msgs.receiver_id = u.id
                WHERE u.last_active_at > $1
                LIMIT 200
            `, [oneWeekAgo]);

            this.logger.log(`Sending weekly summary to ${userStats.length} users`);

            for (const stats of userStats) {
                if (stats.likesReceived === 0 && stats.matchesCount === 0 && stats.messagesReceived === 0) {
                    continue; // Skip if nothing happened
                }

                const message = await this.generateProactiveMessage(stats.userId, 'weekly_summary', {
                    likesReceived: stats.likesReceived,
                    matchesCount: stats.matchesCount,
                    messagesReceived: stats.messagesReceived,
                });

                await this.notificationService.createAndEmit(
                    stats.userId,
                    NotificationType.SYSTEM,
                    '📊 Tuần của bạn',
                    message,
                    { 
                        source: 'wingman_proactive', 
                        trigger: 'weekly_summary',
                        stats,
                    },
                );
            }
        } catch (error) {
            this.logger.error('Failed to send weekly summary:', error);
        }
    }

    /**
     * Daily check at 11:00 AM for incomplete profiles
     */
    @Cron('0 11 * * *')
    async checkIncompleteProfiles() {
        this.logger.log('Running incomplete profile check...');
        
        try {
            // Find users with incomplete profiles who've been on the app > 1 day
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);

            const incompleteProfiles = await this.em.getConnection().execute<{
                userId: string;
                hasPhotos: boolean;
                hasBio: boolean;
                hasTags: boolean;
            }[]>(`
                SELECT 
                    u.id as "userId",
                    (COALESCE(array_length(p.photos::text[]::text[], 1), 0) > 0) as "hasPhotos",
                    (p.bio IS NOT NULL AND LENGTH(p.bio) > 10) as "hasBio",
                    (COALESCE(array_length(p.tags::text[]::text[], 1), 0) > 2) as "hasTags"
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                WHERE u.created_at < $1
                AND (
                    COALESCE(array_length(p.photos::text[]::text[], 1), 0) < 2
                    OR p.bio IS NULL OR LENGTH(p.bio) < 10
                    OR COALESCE(array_length(p.tags::text[]::text[], 1), 0) < 3
                )
                LIMIT 30
            `, [oneDayAgo]);

            this.logger.log(`Found ${incompleteProfiles.length} incomplete profiles`);

            for (const profile of incompleteProfiles) {
                const message = await this.generateProactiveMessage(profile.userId, 'profile_incomplete', {
                    hasPhotos: profile.hasPhotos,
                    hasBio: profile.hasBio,
                    hasTags: profile.hasTags,
                });

                await this.notificationService.createAndEmit(
                    profile.userId,
                    NotificationType.SYSTEM,
                    '✨ Hoàn thiện profile',
                    message,
                    { source: 'wingman_proactive', trigger: 'profile_incomplete' },
                );
            }
        } catch (error) {
            this.logger.error('Failed to check incomplete profiles:', error);
        }
    }

    /**
     * Generate AI-powered proactive message
     */
    async generateProactiveMessage(
        userId: string,
        trigger: ProactiveTrigger,
        context: Record<string, any> = {},
    ): Promise<string> {
        // Use templates with light AI variation
        const templates: Record<ProactiveTrigger, string[]> = {
            inactive_3_days: [
                `Lâu quá không gặp! ${context.newLikesCount > 0 ? `Có ${context.newLikesCount} người mới like bạn đó!` : 'Có người đang đợi bạn quay lại!'} 💕`,
                `Hey ${context.displayName || 'bạn ơi'}! Mình nhớ bạn ghê. ${context.newLikesCount > 0 ? `${context.newLikesCount} người đang chờ bạn discover!` : 'Quay lại xem có ai mới nè!'} 🌟`,
                `Bạn đâu rồi? ${context.newLikesCount > 0 ? `${context.newLikesCount} crush tiềm năng đang đợi!` : 'Cơ hội tình yêu đang chờ bạn!'} ✨`,
            ],
            new_likes: [
                `🔥 ${context.likeCount} người thích bạn hôm nay! Vào xem ai nào~`,
                `Wow! ${context.likeCount} lượt like mới. Có người đang để ý bạn đó!`,
                `${context.likeCount} người nghĩ bạn attractive lắm! Check ngay thôi 💖`,
            ],
            match_no_message: [
                `${context.matchDisplayName} đang đợi tin nhắn đầu tiên! Đừng để họ chờ lâu nha 😊`,
                `Đừng ngại! Gửi "Hi" cho ${context.matchDisplayName} thôi. Cupid tin bạn!`,
                `Match rồi mà im lặng là sao? ${context.matchDisplayName} chắc đang mong chờ lắm đó!`,
            ],
            profile_incomplete: [
                `Profile của bạn mới ${this.calculateProfileScore(context)}% thôi. ${this.getMissingTip(context)}`,
                `Thêm ${this.getMissingItem(context)} để tăng khả năng match lên 3x! 📈`,
                `Cupid thấy profile bạn thiếu ${this.getMissingItem(context)}. Hoàn thiện để có nhiều match hơn nha!`,
            ],
            weekly_summary: [
                `Tuần qua: ${context.likesReceived} likes, ${context.matchesCount} matches${context.messagesReceived > 0 ? `, ${context.messagesReceived} tin nhắn` : ''}! ${context.matchesCount > 0 ? 'Tuyệt vời!' : 'Tiếp tục cố gắng nhé!'} 📊`,
                `📈 Thống kê tuần: ${context.likesReceived} người thích bạn, ${context.matchesCount} match mới. ${context.matchesCount > 0 ? 'Đang hot đó!' : 'Tuần tới sẽ tốt hơn!'}`,
            ],
        };

        const options = templates[trigger];
        const randomMessage = options[Math.floor(Math.random() * options.length)];

        // Optionally use AI to vary the message (skip if rate limited)
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `Viết lại tin nhắn sau theo cách tự nhiên hơn, giữ ý chính, dưới 50 từ, tiếng Việt:
"${randomMessage}"

Chỉ trả lời tin nhắn mới, không giải thích.`;

            const result = await model.generateContent(prompt);
            const aiMessage = result.response.text().trim();
            
            if (aiMessage && aiMessage.length > 10 && aiMessage.length < 200) {
                return aiMessage;
            }
        } catch (error) {
            this.logger.debug('Skipping AI variation, using template');
        }

        return randomMessage;
    }

    private calculateProfileScore(context: Record<string, any>): number {
        let score = 20; // Base
        if (context.hasPhotos) score += 30;
        if (context.hasBio) score += 30;
        if (context.hasTags) score += 20;
        return score;
    }

    private getMissingItem(context: Record<string, any>): string {
        if (!context.hasPhotos) return 'ảnh';
        if (!context.hasBio) return 'bio';
        if (!context.hasTags) return 'tags/sở thích';
        return 'thông tin';
    }

    private getMissingTip(context: Record<string, any>): string {
        if (!context.hasPhotos) return 'Thêm ảnh để được chú ý nhiều hơn!';
        if (!context.hasBio) return 'Viết bio để mọi người hiểu bạn hơn!';
        if (!context.hasTags) return 'Thêm sở thích để tìm người hợp ý!';
        return 'Cập nhật profile thường xuyên nhé!';
    }
}
