import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    forwardRef,
    Inject,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { UserSwipe, SwipeAction } from './entities/user-swipe.entity';
import { Match } from './entities/match.entity';
import { User } from '../user/entities/user.entity';
import { ChatService } from '../chat/chat.service';
import { SwipeResponseDto, RecommendationUserDto, CreateSwipeDto } from './dto';
import { MatchGateway } from './match.gateway';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class SwipeService {
    constructor(
        @InjectRepository(UserSwipe)
        private readonly swipeRepo: EntityRepository<UserSwipe>,
        @InjectRepository(Match)
        private readonly matchRepo: EntityRepository<Match>,
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        private readonly chatService: ChatService,
        @Inject(forwardRef(() => MatchGateway))
        private readonly matchGateway: MatchGateway,
        private readonly notificationService: NotificationService,
        private readonly em: EntityManager,
    ) { }

    /**
     * Get recommendation users that the current user has not swiped on yet
     */
    async getRecommendations(
        userId: string,
        limit: number = 10,
    ): Promise<RecommendationUserDto[]> {
        // Use raw SQL for efficiency
        const sql = `
            SELECT u.*, p.*
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.status = 'active'
            AND u.id != $1
            AND NOT EXISTS (
                SELECT 1 FROM user_swipes s 
                WHERE s.target_id = u.id AND s.swiper_id = $1
            )
            ORDER BY RANDOM()
            LIMIT $2
        `;

        const users = await this.em.getConnection().execute<any[]>(sql, [userId, limit]);

        return users.map((row) => ({
            id: row.id,
            email: row.email,
            display_name: row.display_name || row.email?.split('@')[0] || 'User',
            bio: row.bio,
            location: row.location,
            age: row.age,
            occupation: row.occupation,
            education: row.education,
            photos: row.photos || [],
            prompts: row.prompts || [],
            tags: row.tags || [],
            spotify: row.spotify,
            instagram: row.instagram,
        }));
    }

    /**
     * Record a swipe action with optional message (Hinge-style)
     */
    async recordSwipe(
        swiperId: string,
        dto: CreateSwipeDto,
    ): Promise<SwipeResponseDto> {
        const { targetId, action, message, likedContentId, likedContentType } = dto;

        // Validate: can't swipe on yourself
        if (swiperId === targetId) {
            throw new BadRequestException('Cannot swipe on yourself');
        }

        // Check if target user exists
        const targetUser = await this.userRepo.findOne({ id: targetId }, { populate: ['profile'] });
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        // Check for duplicate swipe
        const existingSwipe = await this.swipeRepo.findOne({
            swiper: { id: swiperId }, target: { id: targetId },
        });
        if (existingSwipe) {
            throw new ConflictException('Already swiped on this user');
        }

        // Save the swipe
        const swipe = new UserSwipe();
        swipe.swiper = this.em.getReference(User, swiperId);
        swipe.target = this.em.getReference(User, targetId);
        swipe.action = action;
        swipe.message = message || null;
        swipe.liked_content_id = likedContentId || null;
        swipe.liked_content_type = likedContentType || null;
        await this.em.persistAndFlush(swipe);

        // If PASS, no match possible
        if (action === SwipeAction.PASS) {
            return { isMatch: false };
        }

        // Check for mutual LIKE (match)
        const mutualLike = await this.swipeRepo.findOne({
            swiper: { id: targetId },
            target: { id: swiperId },
            action: { $in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
        });

        if (!mutualLike) {
            return { isMatch: false };
        }

        // It's a match! Check if match already exists
        const [user1Id, user2Id] =
            swiperId < targetId ? [swiperId, targetId] : [targetId, swiperId];

        const existingMatch = await this.matchRepo.findOne({
            user1: { id: user1Id }, user2: { id: user2Id },
        });

        if (existingMatch) {
            return {
                isMatch: true,
                matchedUser: {
                    id: targetUser.id,
                    display_name: targetUser.profile?.display_name || targetUser.email.split('@')[0],
                },
                conversationId: existingMatch.conversation?.id ?? null,
            };
        }

        // Create conversation for the match
        const conversation = await this.chatService.createConversation(
            'direct',
            [swiperId, targetId],
            'Match Chat',
        );

        // Create match record
        const match = new Match();
        match.user1 = this.em.getReference(User, user1Id);
        match.user2 = this.em.getReference(User, user2Id);
        match.conversation = conversation;
        await this.em.persistAndFlush(match);

        // If a message was sent, insert it
        if (message && message.trim()) {
            await this.chatService.chatMessage(
                conversation.id,
                swiperId,
                message.trim(),
            );
        }

        // Get current user for notification
        const currentUser = await this.userRepo.findOne({ id: swiperId }, { populate: ['profile'] });

        // Emit real-time notifications
        if (this.matchGateway.server) {
            this.matchGateway.emitMatchFound(
                swiperId,
                targetId,
                {
                    matchId: match.id,
                    conversationId: conversation.id,
                    partnerProfile: {
                        id: targetUser.id,
                        display_name: targetUser.profile?.display_name || targetUser.email.split('@')[0],
                        email: targetUser.email,
                    },
                },
                {
                    matchId: match.id,
                    conversationId: conversation.id,
                    partnerProfile: {
                        id: currentUser?.id || swiperId,
                        display_name: currentUser?.profile?.display_name || currentUser?.email?.split('@')[0] || 'User',
                        email: currentUser?.email || '',
                    },
                },
            );
        }

        // Send persistent notifications
        const swiperName = currentUser?.profile?.display_name || currentUser?.email?.split('@')[0] || 'Someone';
        const targetName = targetUser.profile?.display_name || targetUser.email.split('@')[0];

        await this.notificationService.createAndEmit(
            targetId,
            NotificationType.MATCH,
            'New Match! 💕',
            `You matched with ${swiperName}!`,
            { matchId: match.id, conversationId: conversation.id, userId: swiperId, userName: swiperName },
        );

        await this.notificationService.createAndEmit(
            swiperId,
            NotificationType.MATCH,
            'New Match! 💕',
            `You matched with ${targetName}!`,
            { matchId: match.id, conversationId: conversation.id, userId: targetId, userName: targetName },
        );

        return {
            isMatch: true,
            matchedUser: {
                id: targetUser.id,
                display_name: targetUser.profile?.display_name || targetUser.email.split('@')[0],
            },
            conversationId: conversation.id,
        };
    }

    async recordSwipeLegacy(swiperId: string, targetId: string, action: SwipeAction): Promise<SwipeResponseDto> {
        return this.recordSwipe(swiperId, { targetId, action });
    }

    async getMatches(userId: string) {
        return this.matchRepo.find(
            { $or: [{ user1: { id: userId } }, { user2: { id: userId } }] },
            { populate: ['user1', 'user1.profile', 'user2', 'user2.profile'], orderBy: { created_at: 'DESC' } }
        );
    }

    async getRecentMatches(userId: string, limit: number = 5) {
        const matches = await this.matchRepo.find(
            { $or: [{ user1: { id: userId } }, { user2: { id: userId } }] },
            { populate: ['user1', 'user1.profile', 'user2', 'user2.profile', 'conversation'], orderBy: { created_at: 'DESC' }, limit }
        );

        return matches.map((match) => {
            const partner = match.user1.id === userId ? match.user2 : match.user1;
            return {
                id: match.id,
                conversation_id: match.conversation?.id ?? null,
                matchedAt: match.created_at,
                partner: {
                    id: partner.id,
                    email: partner.email,
                    display_name: partner.profile?.display_name || partner.email.split('@')[0],
                },
            };
        });
    }

    async getSuggestedUsers(userId: string, limit: number = 5) {
        // Raw SQL for efficiency
        const sql = `
            SELECT u.*, p.*
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.status = 'active'
            AND u.id != $1
            AND NOT EXISTS (SELECT 1 FROM user_swipes s WHERE s.target_id = u.id AND s.swiper_id = $1)
            AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.user1_id = $1 AND m.user2_id = u.id) OR (m.user2_id = $1 AND m.user1_id = u.id))
            ORDER BY RANDOM()
            LIMIT $2
        `;

        const users = await this.em.getConnection().execute<any[]>(sql, [userId, limit]);

        return users.map((row) => ({
            id: row.id,
            email: row.email,
            display_name: row.display_name || row.email?.split('@')[0] || 'User',
            bio: row.bio,
        }));
    }

    async getLikers(userId: string) {
        // Raw SQL for complex query
        const sql = `
            SELECT s.*, u.*, p.*
            FROM user_swipes s
            LEFT JOIN users u ON s.swiper_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE s.target_id = $1
            AND s.action IN ('LIKE', 'SUPER_LIKE')
            AND NOT EXISTS (
                SELECT 1 FROM matches m 
                WHERE (m.user1_id = $1 AND m.user2_id = s.swiper_id) 
                OR (m.user2_id = $1 AND m.user1_id = s.swiper_id)
            )
            ORDER BY s.created_at DESC
        `;

        const likers = await this.em.getConnection().execute<any[]>(sql, [userId]);

        return likers.map((row) => ({
            id: row.swiper_id,
            display_name: row.display_name || row.email?.split('@')[0] || 'User',
            avatar: row.photos?.[0]?.url,
            isSuperLike: row.action === 'SUPER_LIKE',
            likedAt: row.created_at,
            message: row.message,
        }));
    }

    async checkSuperLikeLimit(userId: string): Promise<{ canSuperLike: boolean; nextResetAt?: Date }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await this.swipeRepo.count({
            swiper: { id: userId },
            action: SwipeAction.SUPER_LIKE,
            created_at: { $gte: today },
        });

        const canSuperLike = count < 1;
        const nextResetAt = new Date(today);
        nextResetAt.setDate(nextResetAt.getDate() + 1);

        return { canSuperLike, nextResetAt: canSuperLike ? undefined : nextResetAt };
    }

    async unmatch(userId: string, matchId: string, blockUser: boolean = false) {
        const match = await this.matchRepo.findOne({ id: matchId });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        await this.em.populate(match, ['user1', 'user2']);
        if (match.user1.id !== userId && match.user2.id !== userId) {
            throw new BadRequestException('You are not part of this match');
        }

        const otherUserId = match.user1.id === userId ? match.user2.id : match.user1.id;

        await this.em.removeAndFlush(match);

        if (blockUser) {
            await this.blockUser(userId, otherUserId);
        }

        return { ok: true, message: 'Unmatched successfully' };
    }

    async blockUser(userId: string, targetId: string) {
        const user = await this.userRepo.findOne({ id: userId });
        if (!user) throw new NotFoundException('User not found');

        const blockedUserIds = user.blockedUserIds || [];
        if (!blockedUserIds.includes(targetId)) {
            blockedUserIds.push(targetId);
            user.blockedUserIds = blockedUserIds;
            await this.em.persistAndFlush(user);
        }

        return { ok: true };
    }

    async reportUser(userId: string, targetId: string, reason: string) {
        console.log(`[REPORT] User ${userId} reported ${targetId} for: ${reason}`);
        await this.blockUser(userId, targetId);
        return { ok: true, message: 'User reported successfully' };
    }
}
