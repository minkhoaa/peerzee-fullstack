import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { WingmanConversation, WingmanMessage } from '../chat/entities/wingman-conversation.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../user/entities/user.entity';
import { PlacesService } from './places.service';
import { ProfileService } from '../user/profile.service';
import { WINGMAN_TOOLS, DateSpot, MatchInfo, ProfileStrength } from './wingman-tools';

interface ToolExecutionResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * WingmanAgenticService - AI Dating Coach with Tool-Calling
 * Uses Gemini function calling to execute actions on behalf of users
 */
@Injectable()
export class WingmanAgenticService {
    private readonly logger = new Logger(WingmanAgenticService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly MAX_TOOL_ITERATIONS = 5;

    constructor(
        @InjectRepository(WingmanConversation)
        private readonly wingmanRepo: EntityRepository<WingmanConversation>,
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        private readonly em: EntityManager,
        private readonly placesService: PlacesService,
        private readonly profileService: ProfileService,
    ) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not set - Wingman AI will not work');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
    }

    /**
     * Main chat with tool-calling loop
     */
    async chat(
        userId: string,
        message: string,
        context?: { targetUserId?: string; chatContext?: string },
    ): Promise<{ 
        reply: string; 
        suggestions?: string[];
        toolsUsed?: string[];
        actions?: { tool: string; result: any }[];
    }> {
        this.logger.log(`[AGENTIC CHAT] User ${userId} says: "${message}"`);
        
        const conversation = await this.getOrCreateConversation(userId);
        const userProfile = await this.profileRepo.findOne({ user: { id: userId } });
        
        // Build system instruction
        const systemInstruction = this.buildSystemInstruction(userProfile, context);

        // Get recent history
        const recentHistory = (conversation.messages || []).slice(-10);

        // Convert tools to Gemini format
        const tools = this.convertToolsToGeminiFormat();

        try {
            this.logger.log(`[AGENTIC CHAT] Calling Gemini with ${tools.length} tools...`);
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash',
                systemInstruction,
                tools: [{ functionDeclarations: tools }],
            });

            // Build chat history
            const chatHistory = recentHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }));

            const chat = model.startChat({ history: chatHistory });

            // Send initial message
            let result = await chat.sendMessage(message);
            let response = result.response;
            
            const toolsUsed: string[] = [];
            const actions: { tool: string; result: any }[] = [];
            let iterations = 0;

            // Tool-calling loop
            while (response.functionCalls() && response.functionCalls()!.length > 0 && iterations < this.MAX_TOOL_ITERATIONS) {
                iterations++;
                const functionCalls = response.functionCalls()!;
                
                this.logger.log(`Tool calls requested: ${functionCalls.map(fc => fc.name).join(', ')}`);

                // Execute each tool call
                const toolResults = await Promise.all(
                    functionCalls.map(async (fc) => {
                        toolsUsed.push(fc.name);
                        const execResult = await this.executeTool(userId, fc.name, fc.args || {}, context);
                        actions.push({ tool: fc.name, result: execResult.data });
                        return {
                            functionResponse: {
                                name: fc.name,
                                response: execResult,
                            },
                        };
                    }),
                );

                // Send tool results back to model
                result = await chat.sendMessage(toolResults.map(tr => ({ functionResponse: tr.functionResponse })));
                response = result.response;
            }

            // Get final text response
            let reply = response.text() || 'Xin lỗi, mình không thể trả lời lúc này.';

            // Extract suggestions if present
            let suggestions: string[] | undefined;
            const suggestionsMatch = reply.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
            if (suggestionsMatch) {
                suggestions = suggestionsMatch[1]
                    .split('\n')
                    .map((s) => s.replace(/^-\s*/, '').trim())
                    .filter((s) => s.length > 0);
                reply = reply.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
            }

            // Save to conversation
            const userMsg: WingmanMessage = {
                role: 'user',
                content: message,
                timestamp: new Date(),
            };
            const assistantMsg: WingmanMessage = {
                role: 'assistant',
                content: reply,
                toolCalls: toolsUsed.length > 0 ? toolsUsed : undefined,
                timestamp: new Date(),
            };

            conversation.messages = [...(conversation.messages || []), userMsg, assistantMsg];
            await this.em.flush();

            return { 
                reply, 
                suggestions,
                toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
                actions: actions.length > 0 ? actions : undefined,
            };
        } catch (error) {
            this.logger.error('[AGENTIC CHAT] Error:', error);
            this.logger.error('[AGENTIC CHAT] Stack:', (error as Error).stack);
            return {
                reply: 'Ối! Mình gặp sự cố rồi. Thử lại sau nhé! 💔',
                suggestions: ['Thử lại', 'Hỏi điều khác'],
            };
        }
    }

    /**
     * Execute a tool by name
     */
    private async executeTool(
        userId: string,
        toolName: string,
        args: Record<string, any>,
        context?: { targetUserId?: string; chatContext?: string },
    ): Promise<ToolExecutionResult> {
        this.logger.log(`Executing tool: ${toolName} with args: ${JSON.stringify(args)}`);

        try {
            switch (toolName) {
                case 'get_my_profile':
                    return await this.toolGetMyProfile(userId);

                case 'update_bio':
                    return await this.toolUpdateBio(userId, args.bio);

                case 'update_tags':
                    return await this.toolUpdateTags(userId, args.tags);

                case 'get_recent_matches':
                    return await this.toolGetRecentMatches(userId, args.limit || 5);

                case 'get_who_liked_me':
                    return await this.toolGetWhoLikedMe(userId);

                case 'generate_icebreaker':
                    return await this.toolGenerateIcebreaker(userId, args.matchUserId || context?.targetUserId);

                case 'search_match_by_name':
                    return await this.toolSearchMatchByName(userId, args.name);

                case 'suggest_date_spots':
                    return await this.toolSuggestDateSpots(
                        userId, 
                        args.matchUserId || context?.targetUserId,
                        args.preferences,
                        args.matchName,
                    );

                case 'analyze_profile_strength':
                    return await this.toolAnalyzeProfileStrength(userId);

                case 'get_conversation_tips':
                    return await this.toolGetConversationTips(
                        userId,
                        args.matchUserId || context?.targetUserId,
                        args.recentMessages || context?.chatContext,
                    );

                default:
                    return { success: false, error: `Unknown tool: ${toolName}` };
            }
        } catch (error) {
            this.logger.error(`Tool ${toolName} failed:`, error);
            return { success: false, error: error.message };
        }
    }

    // =====================================================
    // TOOL IMPLEMENTATIONS
    // =====================================================

    private async toolGetMyProfile(userId: string): Promise<ToolExecutionResult> {
        const profile = await this.profileRepo.findOne({ user: { id: userId } });
        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        return {
            success: true,
            data: {
                display_name: profile.display_name,
                bio: profile.bio,
                age: profile.age,
                occupation: profile.occupation,
                education: profile.education,
                location: profile.location,
                tags: profile.tags,
                photosCount: profile.photos?.length || 0,
                intentMode: profile.intentMode,
                hasSpotify: !!profile.spotify,
            },
        };
    }

    private async toolUpdateBio(userId: string, newBio: string): Promise<ToolExecutionResult> {
        if (!newBio || newBio.length < 10) {
            return { success: false, error: 'Bio phải có ít nhất 10 ký tự' };
        }

        await this.profileService.updateProfile(userId, { bio: newBio });
        
        return {
            success: true,
            data: { message: 'Đã cập nhật bio thành công!', newBio },
        };
    }

    private async toolUpdateTags(userId: string, tags: string[]): Promise<ToolExecutionResult> {
        if (!tags || tags.length === 0) {
            return { success: false, error: 'Cần ít nhất 1 tag' };
        }

        await this.profileService.updateProfile(userId, { tags });
        
        return {
            success: true,
            data: { message: 'Đã cập nhật tags thành công!', tags },
        };
    }

    private async toolGetRecentMatches(userId: string, limit: number): Promise<ToolExecutionResult> {
        const matches = await this.em.getConnection().execute<any[]>(`
            SELECT 
                s1.target_id as "matchUserId",
                COALESCE(p.display_name, 'Unknown') as "displayName",
                p.bio,
                p.tags,
                p.occupation,
                GREATEST(s1.created_at, s2.created_at) as "matchedAt",
                m.content as "lastMessage"
            FROM user_swipes s1
            INNER JOIN user_swipes s2 ON s1.user_id = s2.target_id AND s1.target_id = s2.user_id
            LEFT JOIN user_profiles p ON p.user_id = s1.target_id
            LEFT JOIN LATERAL (
                SELECT content FROM messages 
                WHERE (sender_id = $1 AND receiver_id = s1.target_id) 
                   OR (sender_id = s1.target_id AND receiver_id = $1)
                ORDER BY created_at DESC LIMIT 1
            ) m ON true
            WHERE s1.user_id = $1 AND s1.action = 'LIKE' AND s2.action = 'LIKE'
            ORDER BY GREATEST(s1.created_at, s2.created_at) DESC
            LIMIT $2
        `, [userId, limit]);

        // Find common interests
        const userProfile = await this.profileRepo.findOne({ user: { id: userId } });
        const userTags = new Set(userProfile?.tags || []);

        const matchesWithCommon: MatchInfo[] = matches.map((m) => ({
            userId: m.matchUserId,
            displayName: m.displayName,
            bio: m.bio,
            tags: m.tags,
            occupation: m.occupation,
            matchedAt: m.matchedAt,
            lastMessage: m.lastMessage,
            commonInterests: (m.tags || []).filter((t: string) => userTags.has(t)),
        }));

        return {
            success: true,
            data: { matches: matchesWithCommon, total: matchesWithCommon.length },
        };
    }

    private async toolGetWhoLikedMe(userId: string): Promise<ToolExecutionResult> {
        // For now, show first 3 likers (would be premium feature to see all)
        const likers = await this.em.getConnection().execute<any[]>(`
            SELECT 
                s.user_id as "likerId",
                COALESCE(p.display_name, 'Ai đó') as "displayName",
                CASE WHEN p.photos IS NOT NULL AND jsonb_array_length(p.photos) > 0 
                     THEN true ELSE false END as "hasPhoto",
                s.created_at as "likedAt"
            FROM user_swipes s
            LEFT JOIN user_profiles p ON p.user_id = s.user_id
            WHERE s.target_id = $1 
            AND s.action = 'LIKE'
            AND NOT EXISTS (
                SELECT 1 FROM user_swipes s2 
                WHERE s2.user_id = $1 AND s2.target_id = s.user_id
            )
            ORDER BY s.created_at DESC
            LIMIT 3
        `, [userId]);

        return {
            success: true,
            data: {
                likers: likers.map((l, i) => ({
                    hint: i === 0 ? l.displayName : `Người ${i + 1}`,
                    hasPhoto: l.hasPhoto,
                    likedAt: l.likedAt,
                })),
                totalPending: likers.length,
                message: likers.length > 0 
                    ? `Có ${likers.length} người đang chờ bạn swipe!` 
                    : 'Chưa có ai like bạn gần đây. Hãy cập nhật profile!',
            },
        };
    }

    private async toolGenerateIcebreaker(userId: string, matchUserId?: string): Promise<ToolExecutionResult> {
        if (!matchUserId) {
            return { success: false, error: 'Cần chọn người muốn nhắn tin' };
        }

        const [userProfile, matchProfile] = await Promise.all([
            this.profileRepo.findOne({ user: { id: userId } }),
            this.profileRepo.findOne({ user: { id: matchUserId } }),
        ]);

        if (!matchProfile) {
            return { success: false, error: 'Không tìm thấy profile của match' };
        }

        const commonTags = (userProfile?.tags || [])
            .filter((t) => (matchProfile.tags || []).includes(t));

        const prompt = `Tạo 3 câu mở đầu sáng tạo cho dating app.

Về match:
- Tên: ${matchProfile.display_name}
- Bio: ${matchProfile.bio || 'Không có'}
- Sở thích: ${matchProfile.tags?.join(', ') || 'Chưa rõ'}

Điểm chung: ${commonTags.join(', ') || 'Chưa tìm thấy'}

Yêu cầu:
1. Đề cập điều cụ thể từ profile
2. Vui vẻ, không creepy
3. Có câu hỏi để tạo engagement
4. Viết tiếng Việt

Trả về JSON: { "icebreakers": ["...", "...", "..."] }`;

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return { success: true, data: { ...data, matchName: matchProfile.display_name, commonTags } };
        }

        return {
            success: true,
            data: {
                icebreakers: [
                    `Chào ${matchProfile.display_name}! Thấy bạn thích ${matchProfile.tags?.[0] || 'nhiều thứ hay'}, kể thêm đi! 😄`,
                    'Profile của bạn đáng yêu ghê! Cho mình hỏi chút được không? 🌟',
                ],
                matchName: matchProfile.display_name,
            },
        };
    }

    /**
     * Search matches/conversations by name
     * Returns list of matching users for selection if multiple found
     */
    private async toolSearchMatchByName(userId: string, name: string): Promise<ToolExecutionResult> {
        if (!name || name.trim().length < 1) {
            return { success: false, error: 'Cần nhập tên để tìm kiếm' };
        }

        const searchName = name.trim().toLowerCase();
        this.logger.log(`[SEARCH] Looking for "${searchName}" for user ${userId}`);

        // First, debug: list all conversations for this user
        const debugConversations = await this.em.getConnection().execute<any[]>(`
            SELECT 
                par1.conversation_id,
                par2.user_id as "otherUserId",
                COALESCE(up.display_name, u.email) as "otherUserName"
            FROM participants par1
            INNER JOIN participants par2 ON par1.conversation_id = par2.conversation_id AND par1.user_id != par2.user_id
            INNER JOIN users u ON u.id = par2.user_id
            LEFT JOIN user_profiles up ON up.user_id = par2.user_id
            WHERE par1.user_id = $1
            LIMIT 20
        `, [userId]);
        this.logger.log(`[DEBUG] User ${userId} has ${debugConversations.length} conversations:`);
        debugConversations.forEach((c) => {
            this.logger.log(`  - ${c.otherUserName} (${c.otherUserId})`);
        });

        // Search with better aliasing (fixed: using up instead of p for user_profiles)
        const matches = await this.em.getConnection().execute<any[]>(`
            SELECT DISTINCT
                u.id as "userId",
                COALESCE(up.display_name, u.email) as "displayName",
                up.photos,
                up.bio,
                up.occupation,
                c.last_message_at as "lastChatAt"
            FROM participants par1
            INNER JOIN participants par2 ON par1.conversation_id = par2.conversation_id AND par1.user_id != par2.user_id
            INNER JOIN conversation c ON c.id = par1.conversation_id
            INNER JOIN users u ON u.id = par2.user_id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            WHERE par1.user_id = $1
            AND LOWER(COALESCE(up.display_name, u.email)) LIKE $2
            ORDER BY c.last_message_at DESC NULLS LAST
            LIMIT 10
        `, [userId, `%${searchName}%`]);

        this.logger.log(`[SEARCH] Found ${matches.length} results for "${searchName}"`);
        if (matches.length > 0) {
            this.logger.log(`[SEARCH] First result: ${JSON.stringify(matches[0])}`);
        }

        if (matches.length === 0) {
            return {
                success: true,
                data: {
                    found: false,
                    message: `Không tìm thấy ai tên "${name}" trong danh sách match/chat của bạn.`,
                    suggestions: ['Kiểm tra lại tên', 'Xem danh sách matches bằng cách hỏi "Ai đã match với tôi?"'],
                },
            };
        }

        if (matches.length === 1) {
            const match = matches[0];
            return {
                success: true,
                data: {
                    found: true,
                    single: true,
                    match: {
                        userId: match.userId,
                        displayName: match.displayName,
                        bio: match.bio,
                        occupation: match.occupation,
                        hasPhoto: match.photos?.length > 0,
                    },
                    message: `Tìm thấy ${match.displayName}!`,
                },
            };
        }

        // Multiple matches - return list for selection
        return {
            success: true,
            data: {
                found: true,
                single: false,
                matches: matches.map((m, i) => ({
                    index: i + 1,
                    userId: m.userId,
                    displayName: m.displayName,
                    occupation: m.occupation,
                    bio: m.bio?.substring(0, 50) + (m.bio?.length > 50 ? '...' : ''),
                    lastChatAt: m.lastChatAt,
                })),
                message: `Tìm thấy ${matches.length} người có tên "${name}". Bạn muốn chọn ai?`,
            },
        };
    }

    private async toolSuggestDateSpots(
        userId: string,
        matchUserId?: string,
        preferences?: string[],
        matchName?: string,
    ): Promise<ToolExecutionResult> {
        try {
            // If matchName is provided but not matchUserId, search for the match first
            if (!matchUserId && matchName) {
                const searchResult = await this.toolSearchMatchByName(userId, matchName);
                
                if (!searchResult.success) {
                    return searchResult;
                }

                if (!searchResult.data.found) {
                    return {
                        success: false,
                        error: `Không tìm thấy ai tên "${matchName}". Hãy kiểm tra lại tên hoặc xem danh sách matches.`,
                    };
                }

                // If multiple matches, return selection options
                if (!searchResult.data.single) {
                    return {
                        success: true,
                        data: {
                            needsSelection: true,
                            matches: searchResult.data.matches,
                            message: searchResult.data.message + '\n\nHãy chọn số thứ tự hoặc nói rõ hơn để tôi gợi ý địa điểm hẹn hò.',
                        },
                    };
                }

                // Single match found, use their ID
                matchUserId = searchResult.data.match.userId;
            }

            if (!matchUserId) {
                return { success: false, error: 'Cần chọn người muốn hẹn. Bạn muốn hẹn ai?' };
            }

            const spots = await this.placesService.findDateSpots(userId, matchUserId, preferences);

            // Get match name for personalized response
            const matchProfile = await this.profileRepo.findOne({ user: { id: matchUserId } });
            const matchDisplayName = matchProfile?.display_name || 'bạn ấy';

            return {
                success: true,
                data: {
                    spots,
                    matchName: matchDisplayName,
                    message: spots.length > 0 
                        ? `Tìm thấy ${spots.length} địa điểm phù hợp để hẹn hò với ${matchDisplayName}!`
                        : `Hãy cập nhật vị trí để nhận gợi ý địa điểm hẹn hò với ${matchDisplayName}.`,
                },
            };
        } catch (error) {
            this.logger.error(`toolSuggestDateSpots error: ${error.message}`, error.stack);
            return {
                success: false,
                error: `Có lỗi khi tìm địa điểm: ${error.message}`,
            };
        }
    }

    private async toolAnalyzeProfileStrength(userId: string): Promise<ToolExecutionResult> {
        const profile = await this.profileRepo.findOne({ user: { id: userId } });
        if (!profile) {
            return { success: false, error: 'Profile not found' };
        }

        // Calculate scores
        const photoScore = Math.min((profile.photos?.length || 0) * 20, 100);
        const bioScore = profile.bio ? Math.min(profile.bio.length * 2, 100) : 0;
        const tagsScore = Math.min((profile.tags?.length || 0) * 15, 100);
        const promptsScore = Math.min((profile.prompts?.length || 0) * 25, 100);

        const overallScore = Math.round((photoScore + bioScore + tagsScore + promptsScore) / 4);

        const strength: ProfileStrength = {
            overallScore,
            sections: {
                photos: {
                    score: photoScore,
                    tips: photoScore < 60 
                        ? ['Thêm ít nhất 3 ảnh rõ mặt', 'Thêm 1 ảnh full-body', 'Ảnh nên có ánh sáng tốt']
                        : ['Tuyệt vời! Ảnh của bạn đẹp rồi 📸'],
                },
                bio: {
                    score: bioScore,
                    tips: bioScore < 50
                        ? ['Viết bio ít nhất 50 ký tự', 'Thêm điều thú vị về bản thân', 'Đừng chỉ nói "Hỏi mình biết"']
                        : ['Bio của bạn hấp dẫn! ✨'],
                },
                tags: {
                    score: tagsScore,
                    tips: tagsScore < 45
                        ? ['Chọn ít nhất 5 tags', 'Chọn tags thật của mình', 'Tags giúp tìm người hợp ý']
                        : ['Tags đầy đủ! 🏷️'],
                },
                prompts: {
                    score: promptsScore,
                    tips: promptsScore < 50
                        ? ['Trả lời ít nhất 2 prompts', 'Prompts giúp bắt đầu trò chuyện']
                        : ['Prompts hay lắm! 💬'],
                },
            },
            quickWins: [],
        };

        // Add quick wins
        if (photoScore < 60) strength.quickWins.push('Thêm 1 ảnh → +20% matches');
        if (bioScore < 50) strength.quickWins.push('Viết bio 50+ ký tự → +15% matches');
        if (tagsScore < 45) strength.quickWins.push('Thêm 3 tags → +10% matches');

        return { success: true, data: strength };
    }

    private async toolGetConversationTips(
        userId: string,
        matchUserId?: string,
        recentMessages?: string,
    ): Promise<ToolExecutionResult> {
        if (!matchUserId && !recentMessages) {
            return { success: false, error: 'Cần context cuộc trò chuyện' };
        }

        // Get last messages from DB if not provided
        let chatContext = recentMessages;
        if (!chatContext && matchUserId) {
            const messages = await this.em.getConnection().execute<any[]>(`
                SELECT 
                    CASE WHEN sender_id = $1 THEN 'me' ELSE 'them' END as sender,
                    content
                FROM messages 
                WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
                ORDER BY created_at DESC
                LIMIT 10
            `, [userId, matchUserId]);

            chatContext = messages.reverse()
                .map((m) => `${m.sender === 'me' ? 'Mình' : 'Họ'}: ${m.content}`)
                .join('\n');
        }

        if (!chatContext) {
            return {
                success: true,
                data: {
                    tips: ['Chưa có tin nhắn. Hãy gửi lời chào đầu tiên!'],
                    suggestedReplies: [],
                },
            };
        }

        const prompt = `Phân tích cuộc trò chuyện dating và đưa gợi ý:

${chatContext}

Trả về JSON:
{
  "analysis": "Nhận xét ngắn về cuộc trò chuyện",
  "vibeCheck": "positive/neutral/needs_work",
  "tips": ["gợi ý 1", "gợi ý 2"],
  "suggestedReplies": ["câu trả lời 1", "câu trả lời 2", "câu trả lời 3"]
}

Viết tiếng Việt. Gợi ý reply phù hợp với tone hiện tại.`;

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return { success: true, data: JSON.parse(jsonMatch[0]) };
        }

        return {
            success: true,
            data: {
                analysis: 'Cuộc trò chuyện đang diễn ra tốt!',
                tips: ['Hãy hỏi thêm về sở thích của họ', 'Chia sẻ câu chuyện của mình'],
                suggestedReplies: ['Thật sao? Kể thêm đi! 😄', 'Mình cũng thích vậy!'],
            },
        };
    }

    // =====================================================
    // HELPER METHODS
    // =====================================================

    private async getOrCreateConversation(userId: string): Promise<WingmanConversation> {
        let conversation = await this.wingmanRepo.findOne({ user: { id: userId } });

        if (!conversation) {
            conversation = new WingmanConversation();
            conversation.user = this.em.getReference(User, userId);
            conversation.messages = [];
            conversation.context = {};
            this.em.persist(conversation);
            await this.em.flush();
        }

        return conversation;
    }

    private convertToolsToGeminiFormat() {
        return WINGMAN_TOOLS.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: SchemaType.OBJECT,
                properties: Object.entries(tool.parameters.properties || {}).reduce(
                    (acc, [key, value]: [string, any]) => {
                        acc[key] = {
                            type: value.type === 'array' 
                                ? SchemaType.ARRAY 
                                : SchemaType.STRING,
                            description: value.description,
                            ...(value.items && { items: { type: SchemaType.STRING } }),
                        };
                        return acc;
                    },
                    {} as Record<string, any>,
                ),
                required: tool.parameters.required || [],
            },
        }));
    }

    private buildSystemInstruction(
        userProfile: UserProfile | null,
        context?: { targetUserId?: string; chatContext?: string },
    ): string {
        return `Bạn là "Cupid" - trợ lý hẹn hò AI thân thiện trong app Peerzee.

Tính cách:
- Vui vẻ, đáng yêu, hơi cheeky
- Thực tế, cho lời khuyên cụ thể
- Hỗ trợ tận tình như bạn thân
- Dùng emoji vừa phải
- Nói tiếng Việt tự nhiên

Về user:
- Tên: ${userProfile?.display_name || 'Chưa rõ'}
- Bio: ${userProfile?.bio || 'Chưa có'}
- Sở thích: ${userProfile?.tags?.join(', ') || 'Chưa rõ'}

Bạn CÓ THỂ:
1. Xem và sửa profile của user (bio, tags)
2. Xem ai đã like, matches gần đây
3. Gợi ý câu mở đầu, địa điểm hẹn hò
4. Phân tích cuộc trò chuyện, đưa tips

QUAN TRỌNG:
- Khi user yêu cầu sửa gì → DÙNG TOOL để thực hiện, không chỉ gợi ý
- Xác nhận lại trước khi thay đổi quan trọng
- Nếu cần thông tin → dùng tool lấy, đừng đoán
- Cuối mỗi câu trả lời, có thể thêm 2-3 gợi ý nhanh trong format:
  [SUGGESTIONS]
  - Gợi ý 1
  - Gợi ý 2
  [/SUGGESTIONS]`;
    }

    /**
     * Get conversation history
     */
    async getHistory(userId: string): Promise<WingmanMessage[]> {
        const conversation = await this.wingmanRepo.findOne({ user: { id: userId } });
        return conversation?.messages || [];
    }

    /**
     * Clear conversation history
     */
    async clearHistory(userId: string): Promise<void> {
        const conversation = await this.wingmanRepo.findOne({ user: { id: userId } });
        if (conversation) {
            conversation.messages = [];
            conversation.context = {};
            await this.em.flush();
        }
    }
}
