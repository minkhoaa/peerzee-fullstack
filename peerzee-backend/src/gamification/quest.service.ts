import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserQuest, QuestStatus, QuestType, QUEST_TEMPLATES, QuestTemplate } from './entities/quest.entity';
import { User } from '../user/entities/user.entity';
import { GamificationService } from './gamification.service';

export interface QuestWithTemplate extends QuestTemplate {
    questId: string;
    progress: number;
    status: QuestStatus;
    expiresAt?: Date;
}

@Injectable()
export class QuestService {
    private readonly logger = new Logger(QuestService.name);

    constructor(
        @InjectRepository(UserQuest)
        private readonly questRepo: EntityRepository<UserQuest>,
        private readonly em: EntityManager,
        private readonly gamificationService: GamificationService,
    ) {}

    /**
     * Get active quests for user (create if not exist)
     */
    async getActiveQuests(userId: string): Promise<QuestWithTemplate[]> {
        // Ensure user has daily and weekly quests
        await this.ensureUserQuests(userId);

        const quests = await this.questRepo.find(
            { 
                user: { id: userId },
                status: { $in: [QuestStatus.ACTIVE, QuestStatus.COMPLETED] },
            },
            { orderBy: { createdAt: 'ASC' } }
        );

        return quests.map((quest) => {
            const template = QUEST_TEMPLATES.find((t) => t.id === quest.questTemplateId);
            return {
                questId: quest.id,
                id: quest.questTemplateId,
                title: template?.title || 'Unknown Quest',
                description: template?.description || '',
                type: template?.type || QuestType.DAILY_LOGIN,
                target: quest.target,
                progress: quest.progress,
                rewardXp: quest.rewardXp,
                rewardCoins: quest.rewardCoins,
                icon: template?.icon || '🎯',
                isDaily: template?.isDaily || false,
                isWeekly: template?.isWeekly || false,
                status: quest.status,
                expiresAt: quest.expiresAt,
            };
        });
    }

    /**
     * Ensure user has all daily and weekly quests assigned
     */
    private async ensureUserQuests(userId: string): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

        // Check for existing quests
        const existingQuests = await this.questRepo.find({
            user: { id: userId },
            createdAt: { $gte: today },
        });

        const existingTemplateIds = new Set(existingQuests.map((q) => q.questTemplateId));

        // Create missing daily quests
        const dailyTemplates = QUEST_TEMPLATES.filter((t) => t.isDaily);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        for (const template of dailyTemplates) {
            if (!existingTemplateIds.has(template.id)) {
                const quest = this.questRepo.create({
                    user: this.em.getReference(User, userId),
                    questTemplateId: template.id,
                    progress: 0,
                    target: template.target,
                    rewardXp: template.rewardXp,
                    rewardCoins: template.rewardCoins,
                    status: QuestStatus.ACTIVE,
                    expiresAt: endOfDay,
                    createdAt: new Date(),
                });
                this.em.persist(quest);
            }
        }

        // Check for weekly quests
        const weeklyQuests = await this.questRepo.find({
            user: { id: userId },
            createdAt: { $gte: weekStart },
            questTemplateId: { $in: QUEST_TEMPLATES.filter((t) => t.isWeekly).map((t) => t.id) },
        });

        const weeklyTemplateIds = new Set(weeklyQuests.map((q) => q.questTemplateId));
        const weeklyTemplates = QUEST_TEMPLATES.filter((t) => t.isWeekly);
        const endOfWeek = new Date(weekStart);
        endOfWeek.setDate(weekStart.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        for (const template of weeklyTemplates) {
            if (!weeklyTemplateIds.has(template.id)) {
                const quest = this.questRepo.create({
                    user: this.em.getReference(User, userId),
                    questTemplateId: template.id,
                    progress: 0,
                    target: template.target,
                    rewardXp: template.rewardXp,
                    rewardCoins: template.rewardCoins,
                    status: QuestStatus.ACTIVE,
                    expiresAt: endOfWeek,
                    createdAt: new Date(),
                });
                this.em.persist(quest);
            }
        }

        await this.em.flush();
    }

    /**
     * Update quest progress for a specific type
     */
    async updateProgress(userId: string, questType: QuestType, amount: number = 1): Promise<void> {
        const quests = await this.questRepo.find({
            user: { id: userId },
            status: QuestStatus.ACTIVE,
        });

        for (const quest of quests) {
            const template = QUEST_TEMPLATES.find((t) => t.id === quest.questTemplateId);
            if (template?.type !== questType) continue;

            quest.progress = Math.min(quest.progress + amount, quest.target);

            if (quest.progress >= quest.target) {
                quest.status = QuestStatus.COMPLETED;
                quest.completedAt = new Date();
                this.logger.log(`Quest ${quest.questTemplateId} completed for user ${userId}`);
            }
        }

        await this.em.flush();
    }

    /**
     * Claim rewards for completed quest
     */
    async claimQuest(userId: string, questId: string): Promise<{ xp: number; coins: number } | null> {
        const quest = await this.questRepo.findOne({
            id: questId,
            user: { id: userId },
            status: QuestStatus.COMPLETED,
        });

        if (!quest) {
            return null;
        }

        quest.status = QuestStatus.CLAIMED;
        quest.claimedAt = new Date();

        // Award XP
        await this.gamificationService.addXp(userId, quest.rewardXp, `quest:${quest.questTemplateId}`);

        await this.em.flush();

        return {
            xp: quest.rewardXp,
            coins: quest.rewardCoins,
        };
    }

    /**
     * Get quest summary (total XP earned today, streak)
     */
    async getQuestSummary(userId: string): Promise<{
        totalXpToday: number;
        questsCompleted: number;
        dailyStreak: number;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const claimedToday = await this.questRepo.find({
            user: { id: userId },
            status: QuestStatus.CLAIMED,
            claimedAt: { $gte: today },
        });

        const totalXpToday = claimedToday.reduce((sum, q) => sum + q.rewardXp, 0);
        const questsCompleted = claimedToday.length;

        // Get streak from gamification
        const gamification = await this.gamificationService.getGamification(userId);

        return {
            totalXpToday,
            questsCompleted,
            dailyStreak: gamification.currentStreak,
        };
    }

    /**
     * Expire old quests (run daily at midnight)
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async expireOldQuests(): Promise<void> {
        const now = new Date();

        await this.em.getConnection().execute(`
            UPDATE user_quests 
            SET status = 'EXPIRED' 
            WHERE status = 'ACTIVE' 
            AND expires_at < $1
        `, [now]);

        this.logger.log('Expired old quests');
    }
}
