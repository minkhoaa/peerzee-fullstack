import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    forwardRef,
    Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        private readonly swipeRepo: Repository<UserSwipe>,
        @InjectRepository(Match)
        private readonly matchRepo: Repository<Match>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly chatService: ChatService,
        @Inject(forwardRef(() => MatchGateway))
        private readonly matchGateway: MatchGateway,
        private readonly notificationService: NotificationService,
    ) { }

    /**
     * Get recommendation users that the current user has not swiped on yet
     * Returns Rich Profile data for the matching interface
     */
    async getRecommendations(
        userId: string,
        limit: number = 10,
    ): Promise<RecommendationUserDto[]> {
        // Get all user IDs that current user has already swiped on
        const swipedUserIds = await this.swipeRepo
            .createQueryBuilder('swipe')
            .select('swipe.target_id')
            .where('swipe.swiper_id = :userId', { userId })
            .getRawMany();

        const excludeIds = swipedUserIds.map((s) => s.target_id);
        excludeIds.push(userId); // Exclude self

        // Get users not yet swiped, with their profiles
        const queryBuilder = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.status = :status', { status: 'active' });

        if (excludeIds.length > 0) {
            queryBuilder.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds });
        }

        // TODO: Add discovery settings filtering (age, distance, gender)
        // This would require the current user's discovery_settings

        // Use subquery approach to avoid PostgreSQL DISTINCT + ORDER BY RANDOM() issue
        const users = await queryBuilder
            .addSelect('RANDOM()', 'random_order')
            .orderBy('random_order')
            .limit(limit)
            .getMany();

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            display_name: user.profile?.display_name || user.email.split('@')[0],
            bio: user.profile?.bio,
            location: user.profile?.location,
            age: user.profile?.age,
            occupation: user.profile?.occupation,
            education: user.profile?.education,
            photos: user.profile?.photos || [],
            prompts: user.profile?.prompts || [],
            tags: user.profile?.tags || [],
            spotify: user.profile?.spotify || undefined,
            instagram: user.profile?.instagram,
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
        const targetUser = await this.userRepo.findOne({
            where: { id: targetId },
            relations: ['profile'],
        });
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        // Check for duplicate swipe
        const existingSwipe = await this.swipeRepo.findOne({
            where: { swiper_id: swiperId, target_id: targetId },
        });
        if (existingSwipe) {
            throw new ConflictException('Already swiped on this user');
        }

        // Save the swipe with message details
        await this.swipeRepo.save({
            swiper_id: swiperId,
            target_id: targetId,
            action: action,
            message: message || null,
            liked_content_id: likedContentId || null,
            liked_content_type: likedContentType || null,
        });

        // If PASS, no match possible
        if (action === SwipeAction.PASS) {
            return { isMatch: false };
        }

        // Check for mutual LIKE (match)
        const mutualLike = await this.swipeRepo.findOne({
            where: {
                swiper_id: targetId,
                target_id: swiperId,
                action: SwipeAction.LIKE,
            },
        });

        // Also check for SUPER_LIKE
        const mutualSuperLike = !mutualLike
            ? await this.swipeRepo.findOne({
                where: {
                    swiper_id: targetId,
                    target_id: swiperId,
                    action: SwipeAction.SUPER_LIKE,
                },
            })
            : null;

        if (!mutualLike && !mutualSuperLike) {
            return { isMatch: false };
        }

        // It's a match! Check if match already exists (edge case)
        const [user1Id, user2Id] =
            swiperId < targetId ? [swiperId, targetId] : [targetId, swiperId];

        const existingMatch = await this.matchRepo.findOne({
            where: { user1_id: user1Id, user2_id: user2Id },
        });

        if (existingMatch) {
            // Match already exists, return existing conversation
            return {
                isMatch: true,
                matchedUser: {
                    id: targetUser.id,
                    display_name:
                        targetUser.profile?.display_name || targetUser.email.split('@')[0],
                },
                conversationId: existingMatch.conversation_id,
            };
        }

        // Create conversation for the match
        const conversation = await this.chatService.createConversation(
            'direct',
            [swiperId, targetId],
            'Match Chat',
        );

        // Create match record
        const match = await this.matchRepo.save({
            user1_id: user1Id,
            user2_id: user2Id,
            conversation_id: conversation.id,
        });

        // CRUCIAL: If a message was sent, automatically insert it as the first message
        if (message && message.trim()) {
            await this.chatService.chatMessage(
                conversation.id,
                swiperId,
                message.trim(),
            );
        }

        // Get current user info for notification
        const currentUser = await this.userRepo.findOne({
            where: { id: swiperId },
            relations: ['profile'],
        });

        // Emit real-time match notifications to both users
        if (this.matchGateway.server) {
            this.matchGateway.emitMatchFound(
                swiperId,
                targetId,
                {
                    matchId: match.id,
                    conversationId: conversation.id,
                    partnerProfile: {
                        id: targetUser.id,
                        display_name:
                            targetUser.profile?.display_name ||
                            targetUser.email.split('@')[0],
                        email: targetUser.email,
                    },
                },
                {
                    matchId: match.id,
                    conversationId: conversation.id,
                    partnerProfile: {
                        id: currentUser?.id || swiperId,
                        display_name:
                            currentUser?.profile?.display_name ||
                            currentUser?.email?.split('@')[0] ||
                            'User',
                        email: currentUser?.email || '',
                    },
                },
            );
        }

        // Send persistent notifications to both users
        const swiperName = currentUser?.profile?.display_name || currentUser?.email?.split('@')[0] || 'Someone';
        const targetName = targetUser.profile?.display_name || targetUser.email.split('@')[0];

        // Notify target user
        await this.notificationService.createAndEmit(
            targetId,
            NotificationType.MATCH,
            'New Match! 💕',
            `You matched with ${swiperName}!`,
            {
                matchId: match.id,
                conversationId: conversation.id,
                userId: swiperId,
                userName: swiperName,
            },
        );

        // Notify swiper (current user)
        await this.notificationService.createAndEmit(
            swiperId,
            NotificationType.MATCH,
            'New Match! 💕',
            `You matched with ${targetName}!`,
            {
                matchId: match.id,
                conversationId: conversation.id,
                userId: targetId,
                userName: targetName,
            },
        );

        return {
            isMatch: true,
            matchedUser: {
                id: targetUser.id,
                display_name:
                    targetUser.profile?.display_name || targetUser.email.split('@')[0],
            },
            conversationId: conversation.id,
        };
    }

    /**
     * Legacy method for backward compatibility
     */
    async recordSwipeLegacy(
        swiperId: string,
        targetId: string,
        action: SwipeAction,
    ): Promise<SwipeResponseDto> {
        return this.recordSwipe(swiperId, { targetId, action });
    }

    /**
     * Get all matches for a user
     */
    async getMatches(userId: string) {
        return this.matchRepo.find({
            where: [{ user1_id: userId }, { user2_id: userId }],
            relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
            order: { created_at: 'DESC' },
        });
    }

    /**
     * Get recent matches (for left sidebar)
     */
    async getRecentMatches(userId: string, limit: number = 5) {
        const matches = await this.matchRepo.find({
            where: [{ user1_id: userId }, { user2_id: userId }],
            relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
            order: { created_at: 'DESC' },
            take: limit,
        });

        return matches.map((match) => {
            const partner = match.user1_id === userId ? match.user2 : match.user1;
            return {
                id: match.id,
                conversationId: match.conversation_id,
                matchedAt: match.created_at,
                partner: {
                    id: partner.id,
                    email: partner.email,
                    display_name:
                        partner.profile?.display_name || partner.email.split('@')[0],
                },
            };
        });
    }

    /**
     * Get suggested users (excluding current user and already matched/swiped users)
     */
    async getSuggestedUsers(userId: string, limit: number = 5) {
        // Get all swiped user IDs
        const swipedUserIds = await this.swipeRepo
            .createQueryBuilder('swipe')
            .select('swipe.target_id')
            .where('swipe.swiper_id = :userId', { userId })
            .getRawMany();

        // Get all matched user IDs
        const matches = await this.matchRepo.find({
            where: [{ user1_id: userId }, { user2_id: userId }],
            select: ['user1_id', 'user2_id'],
        });

        const excludeIds = new Set<string>();
        excludeIds.add(userId);
        swipedUserIds.forEach((s) => excludeIds.add(s.target_id));
        matches.forEach((m) => {
            excludeIds.add(m.user1_id);
            excludeIds.add(m.user2_id);
        });

        // Get random users not in exclude list
        const queryBuilder = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.status = :status', { status: 'active' });

        if (excludeIds.size > 0) {
            queryBuilder.andWhere('user.id NOT IN (:...excludeIds)', {
                excludeIds: Array.from(excludeIds),
            });
        }

        // Random order
        const users = await queryBuilder.orderBy('RANDOM()').take(limit).getMany();

        return users.map((user) => ({
            id: user.id,
            email: user.email,
            display_name: user.profile?.display_name || user.email.split('@')[0],
            bio: user.profile?.bio,
        }));
    }

    /**
     * Get users who liked me but no match yet (for "Who Liked Me" feature)
     */
    async getLikers(userId: string) {
        // Find swipes where target is me, action is LIKE or SUPER_LIKE
        const likerSwipes = await this.swipeRepo
            .createQueryBuilder('swipe')
            .leftJoinAndSelect('swipe.swiper', 'swiper')
            .leftJoinAndSelect('swiper.profile', 'profile')
            .where('swipe.target_id = :userId', { userId })
            .andWhere('swipe.action IN (:...actions)', { actions: ['LIKE', 'SUPER_LIKE'] })
            .orderBy('swipe.created_at', 'DESC')
            .getMany();

        // Get existing matches to filter them out
        const matches = await this.matchRepo
            .createQueryBuilder('match')
            .where('match.user1_id = :userId OR match.user2_id = :userId', { userId })
            .getMany();

        const matchedUserIds = new Set<string>();
        matches.forEach(m => {
            matchedUserIds.add(m.user1_id);
            matchedUserIds.add(m.user2_id);
        });

        // Filter out already matched users
        const pendingLikers = likerSwipes.filter(
            swipe => !matchedUserIds.has(swipe.swiper_id)
        );

        return pendingLikers.map(swipe => ({
            id: swipe.swiper.id,
            display_name: swipe.swiper.profile?.display_name || swipe.swiper.email.split('@')[0],
            avatar: swipe.swiper.profile?.photos?.[0]?.url,
            isSuperLike: swipe.action === SwipeAction.SUPER_LIKE,
            likedAt: swipe.created_at,
            message: swipe.message,
        }));
    }

    /**
     * Check if user can send a super like (max 1 per day)
     */
    async checkSuperLikeLimit(userId: string): Promise<{ canSuperLike: boolean; nextResetAt?: Date }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const superLikeCount = await this.swipeRepo
            .createQueryBuilder('swipe')
            .where('swipe.swiper_id = :userId', { userId })
            .andWhere('swipe.action = :action', { action: SwipeAction.SUPER_LIKE })
            .andWhere('swipe.created_at >= :today', { today })
            .getCount();

        const canSuperLike = superLikeCount < 1;

        // Next reset is midnight tomorrow
        const nextResetAt = new Date(today);
        nextResetAt.setDate(nextResetAt.getDate() + 1);

        return { canSuperLike, nextResetAt: canSuperLike ? undefined : nextResetAt };
    }

    /**
     * Unmatch: Delete match and optionally block user
     */
    async unmatch(userId: string, matchId: string, blockUser: boolean = false) {
        const match = await this.matchRepo.findOne({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Verify user is part of the match
        if (match.user1_id !== userId && match.user2_id !== userId) {
            throw new BadRequestException('You are not part of this match');
        }

        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;

        // Delete the match
        await this.matchRepo.delete(matchId);

        // Block user if requested
        if (blockUser) {
            await this.blockUser(userId, otherUserId);
        }

        return { ok: true, message: 'Unmatched successfully' };
    }

    /**
     * Block a user (add to blocked list)
     */
    async blockUser(userId: string, targetId: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const blockedUserIds = user.blockedUserIds || [];
        if (!blockedUserIds.includes(targetId)) {
            blockedUserIds.push(targetId);
            await this.userRepo.update(userId, { blockedUserIds });
        }

        return { ok: true };
    }

    /**
     * Report a user
     */
    async reportUser(userId: string, targetId: string, reason: string) {
        // In production, save to a reports table
        console.log(`[REPORT] User ${userId} reported ${targetId} for: ${reason}`);

        // Auto-block after report
        await this.blockUser(userId, targetId);

        return { ok: true, message: 'User reported successfully' };
    }
}

