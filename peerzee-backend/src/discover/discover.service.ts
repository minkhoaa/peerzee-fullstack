import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSwipe, SwipeAction } from '../swipe/entities/user-swipe.entity';
import { Match } from '../swipe/entities/match.entity';
import { User } from '../user/entities/user.entity';
import { ChatService } from '../chat/chat.service';

// Types
export interface ProfilePhoto {
    id: string;
    url: string;
    isCover?: boolean;
}

export interface ProfilePrompt {
    id: string;
    question: string;
    answer: string;
    emoji?: string;
}

export interface DiscoverUserDto {
    id: string;
    display_name: string;
    bio?: string;
    location?: string;
    age?: number;
    occupation?: string;
    education?: string;
    photos: ProfilePhoto[];
    prompts: ProfilePrompt[];
    tags: string[];
    spotify?: { song: string; artist: string };
    instagram?: string;
    // Rich Profile additions
    intentMode?: string;
    profileProperties?: {
        zodiac?: string;
        mbti?: string;
        habits?: string[];
        height?: string;
        languages?: string[];
        lookingFor?: string;
    };
}

export interface SwipeResult {
    isMatch: boolean;
    matchedUser?: {
        id: string;
        display_name: string;
    };
    conversationId?: string;
}

interface SwipeInput {
    targetId: string;
    action: 'LIKE' | 'PASS' | 'SUPER_LIKE';
    message?: string;
    likedContentId?: string;
    likedContentType?: 'photo' | 'prompt' | 'vibe';
}

@Injectable()
export class DiscoverService {
    constructor(
        @InjectRepository(UserSwipe)
        private readonly swipeRepo: Repository<UserSwipe>,
        @InjectRepository(Match)
        private readonly matchRepo: Repository<Match>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly chatService: ChatService,
    ) { }

    /**
     * Get recommendations using efficient WHERE NOT EXISTS query
     * Excludes: current user, already swiped users
     * CRUCIAL: Only shows users with same intentMode
     * Uses cursor-based pagination for infinite scroll
     */
    async getRecommendations(
        userId: string,
        cursor?: string,
        limit: number = 10,
    ): Promise<{ data: DiscoverUserDto[]; nextCursor: string | null; hasMore: boolean }> {
        // First, get current user's intentMode
        const currentUser = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['profile'],
        });
        const userIntentMode = currentUser?.profile?.intentMode || 'DATE';

        // Build query with exclusion using LEFT JOIN (avoids subquery syntax issues)
        const queryBuilder = this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoin(
                UserSwipe,
                'swipe',
                'swipe.target_id = user.id AND swipe.swiper_id = :userId',
                { userId },
            )
            .where('user.id != :userId', { userId })
            .andWhere('user.status = :status', { status: 'active' })
            .andWhere('swipe.id IS NULL') // Exclude users that have been swiped
            // CRUCIAL: Filter by same intentMode
            .andWhere('profile.intentMode = :intentMode', { intentMode: userIntentMode });

        // Cursor-based pagination (cursor = last user ID)
        if (cursor) {
            queryBuilder.andWhere('user.id > :cursor', { cursor });
        }

        // Order by ID for consistent pagination
        queryBuilder.orderBy('user.id', 'ASC').limit(limit + 1); // Fetch one extra to check hasMore

        const users = await queryBuilder.getMany();

        // Check if there are more results
        const hasMore = users.length > limit;
        const actualUsers = hasMore ? users.slice(0, limit) : users;
        const nextCursor = hasMore ? actualUsers[actualUsers.length - 1]?.id : null;

        // Map to DTO (including profileProperties)
        const data: DiscoverUserDto[] = actualUsers.map((user) => ({
            id: user.id,
            display_name: user.profile?.display_name || user.email.split('@')[0],
            bio: user.profile?.bio || undefined,
            location: user.profile?.location || undefined,
            age: user.profile?.age || undefined,
            occupation: user.profile?.occupation || undefined,
            education: user.profile?.education || undefined,
            photos: (user.profile?.photos as ProfilePhoto[]) || [],
            prompts: (user.profile?.prompts as ProfilePrompt[]) || [],
            tags: (user.profile?.tags as string[]) || [],
            spotify: user.profile?.spotify || undefined,
            instagram: user.profile?.instagram || undefined,
            // Rich Profile additions
            intentMode: user.profile?.intentMode || 'DATE',
            profileProperties: user.profile?.profileProperties || {},
        }));

        return { data, nextCursor, hasMore };
    }

    /**
     * Record swipe with Hinge-style message support
     * Automatically creates conversation if match occurs
     */
    async recordSwipe(userId: string, input: SwipeInput): Promise<SwipeResult> {
        const { targetId, action, message, likedContentId, likedContentType } = input;

        // Validation
        if (userId === targetId) {
            throw new BadRequestException('Cannot swipe on yourself');
        }

        // Check target exists
        const targetUser = await this.userRepo.findOne({
            where: { id: targetId },
            relations: ['profile'],
        });
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        // Check duplicate swipe
        const existingSwipe = await this.swipeRepo.findOne({
            where: { swiper_id: userId, target_id: targetId },
        });
        if (existingSwipe) {
            throw new ConflictException('Already swiped on this user');
        }

        // Map action string to enum
        const swipeAction =
            action === 'SUPER_LIKE'
                ? SwipeAction.SUPER_LIKE
                : action === 'LIKE'
                    ? SwipeAction.LIKE
                    : SwipeAction.PASS;

        // Save swipe
        await this.swipeRepo.save({
            swiper_id: userId,
            target_id: targetId,
            action: swipeAction,
            message: message || null,
            liked_content_id: likedContentId || null,
            liked_content_type: likedContentType || null,
        });

        // If PASS, no match possible
        if (action === 'PASS') {
            return { isMatch: false };
        }

        // Check for mutual like
        const mutualLike = await this.swipeRepo.findOne({
            where: [
                { swiper_id: targetId, target_id: userId, action: SwipeAction.LIKE },
                { swiper_id: targetId, target_id: userId, action: SwipeAction.SUPER_LIKE },
            ],
        });

        if (!mutualLike) {
            return { isMatch: false };
        }

        // It's a match! Create match record and conversation
        const [user1Id, user2Id] =
            userId < targetId ? [userId, targetId] : [targetId, userId];

        // Check if match already exists
        const existingMatch = await this.matchRepo.findOne({
            where: { user1_id: user1Id, user2_id: user2Id },
        });

        if (existingMatch) {
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

        // Create conversation
        const conversation = await this.chatService.createConversation(
            'direct',
            [userId, targetId],
            'Match Chat',
        );

        // Create match
        await this.matchRepo.save({
            user1_id: user1Id,
            user2_id: user2Id,
            conversation_id: conversation.id,
        });

        // If message was sent, auto-insert as first message
        if (message?.trim()) {
            await this.chatService.chatMessage(conversation.id, userId, message.trim());
        }

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
}
