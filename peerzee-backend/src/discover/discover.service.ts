import {
    Injectable,
    ConflictException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
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
    // Distance-based matching
    distance_km?: number;
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
        private readonly swipeRepo: EntityRepository<UserSwipe>,
        @InjectRepository(Match)
        private readonly matchRepo: EntityRepository<Match>,
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
        private readonly chatService: ChatService,
        private readonly aiService: AiService,
        private readonly em: EntityManager,
    ) { }

    /**
     * Get recommendations using efficient WHERE NOT EXISTS query
     * Excludes: current user, already swiped users
     * CRUCIAL: Only shows users with same intentMode
     * Uses cursor-based pagination for infinite scroll
     * Optionally filters by distance using Haversine formula
     */
    async getRecommendations(
        userId: string,
        cursor?: string,
        limit: number = 10,
        userLat?: number,
        userLong?: number,
        radiusInKm?: number,
    ): Promise<{ data: DiscoverUserDto[]; nextCursor: string | null; hasMore: boolean }> {
        // First, get current user's intentMode and location
        const currentUser = await this.userRepo.findOne({ id: userId }, { populate: ['profile'] });
        const userIntentMode = currentUser?.profile?.intentMode || 'DATE';

        // Use user's location if not provided
        const lat = userLat ?? currentUser?.profile?.latitude;
        const long = userLong ?? currentUser?.profile?.longitude;

        let distanceCalc = 'NULL as distance';
        let distanceFilter = '';
        const params: any[] = [userId, userIntentMode, userId, 'active']; // $1, $2, $3, $4

        // Add location-based filtering if coordinates provided
        if (lat && long && radiusInKm) {
            // Haversine formula
            distanceCalc = `
                (6371 * acos(
                    cos(radians(${lat})) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians(${long})) + 
                    sin(radians(${lat})) * sin(radians(p.latitude))
                )) AS distance
            `;
            distanceFilter = `
                AND p.latitude IS NOT NULL 
                AND p.longitude IS NOT NULL 
                AND (6371 * acos(
                    cos(radians(${lat})) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians(${long})) + 
                    sin(radians(${lat})) * sin(radians(p.latitude))
                )) <= ${radiusInKm}
            `;
        }

        // Cursor pagination
        let cursorFilter = '';
        if (cursor) {
            cursorFilter = `AND u.id > '${cursor}'`;
        }

        // RAW SQL IS MUST HERE for complex joins and exclusions
        const sql = `
            SELECT u.id, u.email, p.*, ${distanceCalc}
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id != $1
            AND u.status = $4
            AND p."intentMode" = $2
            AND NOT EXISTS (
                SELECT 1 FROM user_swipes s 
                WHERE s.target_id = u.id AND s.swiper_id = $3
            )
            ${distanceFilter}
            ${cursorFilter}
            ORDER BY ${lat && long && radiusInKm ? 'distance ASC,' : ''} u.id ASC
            LIMIT ${limit + 1}
        `;

        const rawResults = await this.em.getConnection().execute<any[]>(sql, params);

        // Check if there are more results
        const hasMore = rawResults.length > limit;
        const users = hasMore ? rawResults.slice(0, limit) : rawResults;
        const nextCursor = hasMore ? users[users.length - 1]?.id : null;

        // Map to DTO
        const data: DiscoverUserDto[] = users.map((row) => ({
            id: row.id,
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
            intentMode: row.intentMode || 'DATE',
            profileProperties: row.profileProperties || {},
            distance_km: row.distance ? parseFloat(row.distance) : undefined,
        }));

        return { data, nextCursor, hasMore };
    }

    /**
     * Get recommendations by specific location (for explicit lat/long params)
     * Used when user provides location in query params
     */
    async getRecommendationsByLocation(
        userId: string,
        userLat: number,
        userLong: number,
        radiusInKm: number = 50,
        limit: number = 10,
    ): Promise<{ data: DiscoverUserDto[]; total: number }> {
        // Get current user's intentMode
        const currentUser = await this.userRepo.findOne({ id: userId }, { populate: ['profile'] });
        const userIntentMode = currentUser?.profile?.intentMode || 'DATE';

        const sql = `
            SELECT 
                u.id, u.email, p.*,
                (6371 * acos(
                    cos(radians($1)) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians($2)) + 
                    sin(radians($1)) * sin(radians(p.latitude))
                )) AS distance
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id != $3
            AND u.status = 'active'
            AND p."intentMode" = $4
            AND p.latitude IS NOT NULL 
            AND p.longitude IS NOT NULL 
            AND NOT EXISTS (
                SELECT 1 FROM user_swipes s 
                WHERE s.target_id = u.id AND s.swiper_id = $3
            )
            AND (6371 * acos(
                cos(radians($1)) * cos(radians(p.latitude)) * 
                cos(radians(p.longitude) - radians($2)) + 
                sin(radians($1)) * sin(radians(p.latitude))
            )) <= $5
            ORDER BY distance ASC
            LIMIT $6
        `;

        const rawResults = await this.em.getConnection().execute<any[]>(sql, [
            userLat, userLong, userId, userIntentMode, radiusInKm, limit
        ]);

        const data: DiscoverUserDto[] = rawResults.map((row) => ({
            id: row.id,
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
            intentMode: row.intentMode || 'DATE',
            profileProperties: row.profileProperties || {},
            distance_km: row.distance ? parseFloat(row.distance) : undefined,
        }));

        return { data, total: data.length };
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
        const targetUser = await this.userRepo.findOne({ id: targetId }, { populate: ['profile'] });
        if (!targetUser) {
            throw new NotFoundException('Target user not found');
        }

        // Check duplicate swipe
        const existingSwipe = await this.swipeRepo.findOne({
            swiper: { id: userId }, target: { id: targetId },
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
        const swipe = new UserSwipe();
        swipe.swiper = this.em.getReference(User, userId);
        swipe.target = this.em.getReference(User, targetId);
        swipe.action = swipeAction;
        swipe.message = message || null;
        swipe.liked_content_id = likedContentId || null;
        swipe.liked_content_type = likedContentType || null;
        await this.em.persistAndFlush(swipe);

        // If PASS, no match possible
        if (action === 'PASS') {
            return { isMatch: false };
        }

        // Check for mutual like
        const mutualLike = await this.swipeRepo.findOne({
            swiper: { id: targetId },
            target: { id: userId },
            action: { $in: [SwipeAction.LIKE, SwipeAction.SUPER_LIKE] },
        });

        if (!mutualLike) {
            return { isMatch: false };
        }

        // It's a match! Create match record and conversation
        const [user1Id, user2Id] =
            userId < targetId ? [userId, targetId] : [targetId, userId];

        // Check if match already exists
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

        // Create conversation
        const conversation = await this.chatService.createConversation(
            'direct',
            [userId, targetId],
            'Match Chat',
        );

        // Create match
        const match = new Match();
        match.user1 = this.em.getReference(User, user1Id);
        match.user2 = this.em.getReference(User, user2Id);
        match.conversation = conversation;
        await this.em.persistAndFlush(match);

        // Generate AI icebreaker for the new match
        try {
            const currentUser = await this.userRepo.findOne({ id: userId }, { populate: ['profile'] });

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
        userLat?: number,
        userLong?: number,
        radiusInKm?: number,
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

        // Step 3: Build raw SQL query
        let whereClause = `p.user_id != '${currentUserId}' AND u.status = 'active'`;
        const params: any[] = [];
        let paramIdx = 1;

        if (filters.gender) {
            // params.push(filters.gender);
            // whereClause += ` AND p.gender = $${paramIdx++}`;
        }
        if (filters.city) {
            // params.push(`%${filters.city}%`);
            // whereClause += ` AND LOWER(p.city) LIKE LOWER($${paramIdx++})`;
        }
        if (filters.intent) {
            params.push(filters.intent);
            whereClause += ` AND p."intentMode" = $${paramIdx++}`;
        }

        // Optional location filter
        let distanceSelect = 'NULL as distance_km';
        if (userLat !== undefined && userLong !== undefined && radiusInKm) {
            distanceSelect = `
                ROUND(
                    CAST(
                        (6371 * acos(
                            cos(radians(${userLat})) * cos(radians(p.latitude)) * 
                            cos(radians(p.longitude) - radians(${userLong})) + 
                            sin(radians(${userLat})) * sin(radians(p.latitude))
                        )) AS numeric
                    ), 2
                ) as distance_km
            `;
            whereClause += `
                AND p.latitude IS NOT NULL 
                AND p.longitude IS NOT NULL 
                AND (6371 * acos(
                    cos(radians(${userLat})) * cos(radians(p.latitude)) * 
                    cos(radians(p.longitude) - radians(${userLong})) + 
                    sin(radians(${userLat})) * sin(radians(p.latitude))
                )) <= ${radiusInKm}
            `;
        }

        let vectorScoreCalc = '0';
        let orderBy = '';

        if (queryEmbedding.length > 0) {
            // Using pgvector operator <=> (cosine distance)
            const vectorStr = `[${queryEmbedding.join(',')}]`;

            vectorScoreCalc = `
                (
                    -- 1. Vector Similarity (60% weight)
                    (1 - (p."bioEmbedding" <=> '${vectorStr}')) * 0.6 +
                    -- 2. Activity Recency (20% weight)
                    (CASE 
                        WHEN p."lastActive" > NOW() - INTERVAL '1 day' THEN 1
                        WHEN p."lastActive" > NOW() - INTERVAL '7 days' THEN 0.7
                        WHEN p."lastActive" > NOW() - INTERVAL '30 days' THEN 0.5
                        ELSE 0.3
                    END) * 0.2 +
                    -- 3. Profile Completeness (20% weight)
                    (CASE 
                        WHEN p.photos IS NOT NULL AND jsonb_array_length(p.photos) > 0 THEN 0.4
                        ELSE 0
                    END +
                    CASE WHEN p.bio IS NOT NULL AND p.bio != '' THEN 0.3 ELSE 0 END +
                    CASE WHEN p.tags IS NOT NULL AND jsonb_array_length(p.tags) > 0 THEN 0.3 ELSE 0 END
                    ) * 0.2
                )
            `;
            whereClause += ` AND p."bioEmbedding" IS NOT NULL`;
            orderBy = `ORDER BY weighted_score DESC`;
        } else {
            vectorScoreCalc = `
                (
                    (CASE 
                        WHEN p."lastActive" > NOW() - INTERVAL '1 day' THEN 1
                        WHEN p."lastActive" > NOW() - INTERVAL '7 days' THEN 0.7
                        ELSE 0.5
                    END) * 0.5 +
                    (CASE 
                        WHEN p.photos IS NOT NULL AND jsonb_array_length(p.photos) > 0 THEN 0.5
                        ELSE 0.25
                    END)
                )
            `;
            orderBy = `ORDER BY weighted_score DESC`;
        }

        const sql = `
            SELECT 
                p.*, 
                u.email,
                ${distanceSelect},
                ${vectorScoreCalc} as weighted_score
            FROM user_profiles p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE ${whereClause}
            ${orderBy}
            LIMIT ${limit}
        `;

        const rawResults = await this.em.getConnection().execute<any[]>(sql, params);

        // Generate match reasons
        const generateMatchReason = (profile: any, searchFilters: SearchFilters): string => {
            const reasons: string[] = [];
            // Match by intent
            if (searchFilters.intent && profile.intentMode === searchFilters.intent) {
                const intentLabels: Record<string, string> = {
                    'DATE': 'Tìm người hẹn hò',
                    'STUDY': 'Muốn học cùng',
                    'FRIEND': 'Tìm bạn mới',
                };
                reasons.push(`🎯 ${intentLabels[searchFilters.intent] || searchFilters.intent}`);
            }
            // Match by keywords
            if (searchFilters.semantic_text && profile.tags?.length) {
                const searchKeywords = searchFilters.semantic_text.toLowerCase().split(' ');
                const matchedTags = (profile.tags as string[]).filter((tag: string) =>
                    searchKeywords.some((kw: string) => tag.toLowerCase().includes(kw) || kw.includes(tag.toLowerCase()))
                );
                if (matchedTags.length > 0) {
                    reasons.push(`🏷️ ${matchedTags.slice(0, 2).join(', ')}`);
                }
            }
            // Fallback
            if (reasons.length === 0) {
                reasons.push(profile.bio ? '✨ Có profile đầy đủ' : '👋 Mới tham gia');
            }
            return reasons.slice(0, 2).join(' • ');
        };

        // Map results
        const results = rawResults.map((row) => ({
            id: row.user_id,
            display_name: row.display_name || row.email?.split('@')[0] || 'Unknown',
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
            intentMode: row.intentMode || 'DATE',
            profileProperties: row.profileProperties || {},
            matchScore: Math.round((parseFloat(row.weighted_score) || 0) * 100),
            matchReason: generateMatchReason(row, filters),
            distance_km: row.distance_km ? parseFloat(row.distance_km) : undefined,
        }));

        this.logger.log(`Found ${results.length} results for query: "${query}"`);

        return { filters, results };
    }
}
