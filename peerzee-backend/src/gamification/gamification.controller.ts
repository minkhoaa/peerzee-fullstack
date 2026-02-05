import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { QuestService } from './quest.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: { sub: string; email: string };
}

@Controller('gamification')
@UseGuards(AuthGuard)
export class GamificationController {
    constructor(
        private readonly gamificationService: GamificationService,
        private readonly questService: QuestService,
    ) {}

    /**
     * GET /gamification/me - Get current user gamification status
     */
    @Get('me')
    async getMyStatus(@Req() req: AuthenticatedRequest) {
        const userId = req.user.sub;
        const gamification = await this.gamificationService.getGamification(userId);
        
        // Calculate XP needed for next level
        const currentXp = gamification.xp;
        const currentLevel = gamification.level;
        const xpForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
        const xpForNextLevel = currentLevel * currentLevel * 100;
        const xpProgress = currentXp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;

        return {
            xp: gamification.xp,
            level: gamification.level,
            badges: gamification.badges,
            currentStreak: gamification.currentStreak,
            xpProgress,
            xpNeeded,
            progressPercent: Math.round((xpProgress / xpNeeded) * 100),
        };
    }

    /**
     * GET /gamification/quests - Get active quests
     */
    @Get('quests')
    async getQuests(@Req() req: AuthenticatedRequest) {
        const userId = req.user.sub;
        const quests = await this.questService.getActiveQuests(userId);
        const summary = await this.questService.getQuestSummary(userId);

        return {
            quests,
            ...summary,
        };
    }

    /**
     * POST /gamification/quests/:questId/claim - Claim quest rewards
     */
    @Post('quests/:questId/claim')
    async claimQuest(
        @Req() req: AuthenticatedRequest,
        @Param('questId') questId: string,
    ) {
        const userId = req.user.sub;
        const result = await this.questService.claimQuest(userId, questId);

        if (!result) {
            return { success: false, error: 'Quest not found or not completed' };
        }

        return {
            success: true,
            reward: result,
        };
    }

    /**
     * GET /gamification/leaderboard - Get weekly leaderboard
     */
    @Get('leaderboard')
    async getLeaderboard(@Req() req: AuthenticatedRequest) {
        const userId = req.user.sub;

        // Get top 10 users by XP
        const leaders = await this.gamificationService['em'].getConnection().execute<any[]>(`
            SELECT 
                g.user_id,
                g.xp,
                g.level,
                COALESCE(p.display_name, 'Anonymous') as display_name,
                CASE WHEN p.photos IS NOT NULL AND jsonb_array_length(p.photos) > 0 
                     THEN p.photos->0->>'url' 
                     ELSE NULL 
                END as avatar_url
            FROM user_gamification g
            LEFT JOIN user_profiles p ON p.user_id = g.user_id
            ORDER BY g.xp DESC
            LIMIT 10
        `);

        // Find user's rank
        const userRank = await this.gamificationService['em'].getConnection().execute<any[]>(`
            SELECT COUNT(*) + 1 as rank
            FROM user_gamification
            WHERE xp > (SELECT xp FROM user_gamification WHERE user_id = $1)
        `, [userId]);

        return {
            leaders: leaders.map((l, i) => ({
                rank: i + 1,
                userId: l.user_id,
                displayName: l.display_name,
                avatarUrl: l.avatar_url,
                xp: l.xp,
                level: l.level,
                isCurrentUser: l.user_id === userId,
            })),
            myRank: userRank[0]?.rank || 0,
        };
    }
}
