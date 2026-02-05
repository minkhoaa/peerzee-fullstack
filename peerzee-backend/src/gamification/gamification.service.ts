import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { UserGamification } from './entities/user-gamification.entity';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';

export interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    xpGained: number;
}

@Injectable()
export class GamificationService {
    private readonly logger = new Logger(GamificationService.name);

    constructor(
        @InjectRepository(UserGamification)
        private readonly gamificationRepo: EntityRepository<UserGamification>,
        private readonly em: EntityManager,
        private readonly notificationService: NotificationService,
    ) { }

    /**
   * Get or create gamification record for user
   */
    async getGamification(userId: string): Promise<UserGamification> {
        let record = await this.gamificationRepo.findOne({ user: { id: userId } });

        if (!record) {
            record = this.gamificationRepo.create({
                user: this.em.getReference(User, userId),
                xp: 0,
                level: 1,
                badges: [],
                currentStreak: 0,
                lastActionAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.em.persistAndFlush(record);
        }

        return record;
    }

    /**
     * Add XP to user and check for level up
     */
    async addXp(userId: string, amount: number, source: string): Promise<LevelUpResult> {
        const record = await this.getGamification(userId);
        const oldLevel = record.level;

        record.xp += amount;
        record.lastActionAt = new Date();

        // Calculate new level
        // Formula: Level = floor(sqrt(XP / 100)) + 1
        // Level 1: 0-99 XP
        // Level 2: 100-399 XP
        // Level 3: 400-899 XP
        const newLevel = Math.floor(Math.sqrt(record.xp / 100)) + 1;

        let leveledUp = false;
        if (newLevel > oldLevel) {
            record.level = newLevel;
            leveledUp = true;
            this.logger.log(`User ${userId} leveled up to ${newLevel} via ${source}`);

            // Notify user
            await this.notificationService.createAndEmit(
                userId,
                // @ts-ignore
                'SYSTEM',
                '🎉 Level Up!',
                `Chúc mừng! Bạn đã đạt Level ${newLevel}. Tiếp tục phát huy nhé!`,
                { type: 'LEVEL_UP', level: newLevel }
            );
        }

        await this.em.persistAndFlush(record);

        return {
            oldLevel,
            newLevel,
            xpGained: amount
        };
    }

    /**
     * Award a badge to user
     */
    async awardBadge(userId: string, badgeId: string): Promise<boolean> {
        const record = await this.getGamification(userId);

        if (record.badges.includes(badgeId)) {
            return false; // Already has badge
        }

        record.badges.push(badgeId);
        await this.em.persistAndFlush(record);

        await this.notificationService.createAndEmit(
            userId,
            // @ts-ignore
            'SYSTEM',
            '🏆 New Badge Unlocked!',
            `Bạn vừa nhận được huy hiệu mới. Kiểm tra profile ngay!`,
            { type: 'BADGE_AWARDED', badge: badgeId }
        );

        return true;
    }
}
