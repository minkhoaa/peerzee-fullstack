import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSwipe, SwipeAction } from '../swipe/entities/user-swipe.entity';
import { Match } from '../swipe/entities/match.entity';
import { User } from '../user/entities/user.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { ChatService } from '../chat/chat.service';
import { AiService, SearchFilters } from '../ai/ai.service';

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
    private readonly logger = new Logger(DiscoverService.name);

    constructor(
        @InjectRepository(UserSwipe)
        private readonly swipeRepo: Repository<UserSwipe>,
        @InjectRepository(Match)
        private readonly matchRepo: Repository<Match>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: Repository<UserProfile>,
        private readonly chatService: ChatService,
        private readonly aiService: AiService,
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

        // Generate AI icebreaker for the new match
        try {
            const currentUser = await this.userRepo.findOne({
                where: { id: userId },
                relations: ['profile'],
            });

            if (currentUser?.profile && targetUser?.profile) {
                const icebreaker = await this.aiService.generateIcebreaker(
                    {
                        bio: currentUser.profile.bio,
                        tags: currentUser.profile.tags as string[],
                        intentMode: currentUser.profile.intentMode,
                        occupation: currentUser.profile.occupation,
                        display_name: currentUser.profile.display_name,
                    },
                    {
                        bio: targetUser.profile.bio,
                        tags: targetUser.profile.tags as string[],
                        intentMode: targetUser.profile.intentMode,
                        occupation: targetUser.profile.occupation,
                        display_name: targetUser.profile.display_name,
                    }
                );

                // Save icebreaker to conversation
                await this.chatService.updateConversationIcebreaker(conversation.id, icebreaker);
                this.logger.log(`Generated icebreaker for match: ${conversation.id}`);
            }
        } catch (error) {
            this.logger.error('Failed to generate icebreaker for match', error);
            // Don't fail the match if icebreaker generation fails
        }

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

    /**
     * Hybrid Semantic Search
     * Combines hard SQL filters (gender, city, intent) with soft vector similarity
     */
    async searchUsers(
        query: string,
        currentUserId: string,
        limit: number = 10,
    ): Promise<{
        filters: SearchFilters;
        results: (DiscoverUserDto & { matchScore: number })[];
    }> {
        this.logger.log(`Hybrid search: "${query}" by user ${currentUserId}`);

        // Step 1: Extract structured filters from natural language
        const filters = await this.aiService.extractSearchFilters(query);
        this.logger.log(`Extracted filters: ${JSON.stringify(filters)}`);

        // Step 2: Generate embedding for semantic search
        let queryEmbedding: number[] = [];
        if (filters.semantic_text) {
            try {
                queryEmbedding = await this.aiService.generateEmbedding(filters.semantic_text);
            } catch (error) {
                this.logger.warn('Failed to generate query embedding, falling back to SQL-only search');
            }
        }

        // Step 3: Build hybrid query with WEIGHTED SCORING
        // Formula: Score = (VectorSimilarity × 0.6) + (ActivityRecency × 0.2) + (ProfileCompleteness × 0.2)
        const queryBuilder = this.profileRepo
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user')
            .where('profile.user_id != :currentUserId', { currentUserId })
            .andWhere('user.status = :status', { status: 'active' });

        // Hard filters (SQL)
        if (filters.gender) {
            queryBuilder.andWhere('profile.gender = :gender', { gender: filters.gender });
        }
        if (filters.city) {
            queryBuilder.andWhere('LOWER(profile.city) LIKE LOWER(:city)', { city: `%${filters.city}%` });
        }
        if (filters.intent) {
            queryBuilder.andWhere('profile."intentMode" = :intent', { intent: filters.intent });
        }

        // WEIGHTED HYBRID SCORE
        if (queryEmbedding.length > 0) {
            queryBuilder
                .andWhere('profile."bioEmbedding" IS NOT NULL')
                .addSelect(
                    `(
                        -- 1. Vector Similarity (60% weight)
                        (1 - (profile."bioEmbedding" <=> :queryVector)) * 0.6 +
                        -- 2. Activity Recency (20% weight) - Online in last 24h=1, 7days=0.7, else=0.3
                        (CASE 
                            WHEN profile."lastActive" > NOW() - INTERVAL '1 day' THEN 1
                            WHEN profile."lastActive" > NOW() - INTERVAL '7 days' THEN 0.7
                            WHEN profile."lastActive" > NOW() - INTERVAL '30 days' THEN 0.5
                            ELSE 0.3
                        END) * 0.2 +
                        -- 3. Profile Completeness (20% weight) - Has photo + bio + tags
                        (CASE 
                            WHEN profile.photos IS NOT NULL AND jsonb_array_length(profile.photos) > 0 THEN 0.4
                            ELSE 0
                        END +
                        CASE WHEN profile.bio IS NOT NULL AND profile.bio != '' THEN 0.3 ELSE 0 END +
                        CASE WHEN profile.tags IS NOT NULL AND jsonb_array_length(profile.tags) > 0 THEN 0.3 ELSE 0 END
                        ) * 0.2
                    )`,
                    'weightedScore'
                )
                .setParameter('queryVector', `[${queryEmbedding.join(',')}]`)
                .orderBy('"weightedScore"', 'DESC');
        } else {
            // Fallback: score by activity and completeness only
            queryBuilder
                .addSelect(
                    `(
                        (CASE 
                            WHEN profile."lastActive" > NOW() - INTERVAL '1 day' THEN 1
                            WHEN profile."lastActive" > NOW() - INTERVAL '7 days' THEN 0.7
                            ELSE 0.5
                        END) * 0.5 +
                        (CASE 
                            WHEN profile.photos IS NOT NULL AND jsonb_array_length(profile.photos) > 0 THEN 0.5
                            ELSE 0.25
                        END)
                    )`,
                    'weightedScore'
                )
                .orderBy('"weightedScore"', 'DESC');
        }

        queryBuilder.limit(limit);

        // Execute query
        const rawResults = await queryBuilder.getRawAndEntities();

        // Generate match reasons for each result
        const generateMatchReason = (profile: UserProfile, searchFilters: SearchFilters): string => {
            const reasons: string[] = [];

            // Match by city
            if (searchFilters.city && profile.city) {
                reasons.push(`📍 Ở ${profile.city}`);
            }

            // Match by intent
            if (searchFilters.intent) {
                const intentLabels: Record<string, string> = {
                    'DATE': 'Tìm người hẹn hò',
                    'STUDY': 'Muốn học cùng',
                    'FRIEND': 'Tìm bạn mới',
                };
                reasons.push(`🎯 ${intentLabels[searchFilters.intent] || searchFilters.intent}`);
            }

            // Match by semantic text (keywords)
            if (searchFilters.semantic_text && profile.tags?.length) {
                const searchKeywords = searchFilters.semantic_text.toLowerCase().split(' ');
                const matchedTags = (profile.tags as string[]).filter(tag =>
                    searchKeywords.some(kw => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()))
                );
                if (matchedTags.length > 0) {
                    reasons.push(`🏷️ ${matchedTags.slice(0, 2).join(', ')}`);
                }
            }

            // Match by occupation
            if (profile.occupation && searchFilters.semantic_text?.toLowerCase().includes(profile.occupation.toLowerCase().split(' ')[0])) {
                reasons.push(`💼 ${profile.occupation}`);
            }

            // Fallback
            if (reasons.length === 0) {
                if (profile.bio) {
                    reasons.push('✨ Có profile đầy đủ');
                } else {
                    reasons.push('👋 Mới tham gia');
                }
            }

            return reasons.slice(0, 2).join(' • ');
        };

        // Map results with match scores and reasons
        const results = rawResults.entities.map((profile, index) => {
            const rawRow = rawResults.raw[index];
            const weightedScore = rawRow?.weightedScore ? parseFloat(rawRow.weightedScore) : 0;

            return {
                id: profile.user_id,
                display_name: profile.display_name || 'Unknown',
                bio: profile.bio || undefined,
                location: profile.location || undefined,
                age: profile.age || undefined,
                occupation: profile.occupation || undefined,
                education: profile.education || undefined,
                photos: (profile.photos as ProfilePhoto[]) || [],
                prompts: (profile.prompts as ProfilePrompt[]) || [],
                tags: (profile.tags as string[]) || [],
                spotify: profile.spotify || undefined,
                instagram: profile.instagram || undefined,
                intentMode: profile.intentMode || 'DATE',
                profileProperties: profile.profileProperties || {},
                matchScore: Math.round(weightedScore * 100),
                matchReason: generateMatchReason(profile, filters), // NEW: Why we match
            };
        });

        this.logger.log(`Found ${results.length} results for query: "${query}"`);

        return { filters, results };
    }
}
