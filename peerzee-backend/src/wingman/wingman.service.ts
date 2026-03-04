import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { WingmanConversation, WingmanMessage } from '../chat/entities/wingman-conversation.entity';
import { Message } from '../chat/entities/message.entity';
import { Conversation } from '../chat/entities/conversation.entity';
import { Participant } from '../chat/entities/participants.entity';
import { UserProfile } from '../user/entities/user-profile.entity';
import { User } from '../user/entities/user.entity';

interface ProfileData {
  display_name?: string;
  bio?: string;
  tags?: string[];
  occupation?: string;
  intentMode?: string;
}

interface MatchData {
  targetUserId?: string;
  targetProfile?: ProfileData;
  conversationContext?: string;
}

export interface DateIdeaLocation {
  place_name: string;
  address: string;
  google_maps_url: string;
}

export interface DateIdea {
  title: string;
  location: DateIdeaLocation;
  description: string;
  why_it_matches: string;
}

export interface DateIdeasResult {
  host_message: string;
  date_ideas: DateIdea[];
  ice_breaker_offline?: string;
}

export interface WingmanSuggestion {
  place_name: string;
  address: string;
  google_maps_url: string;
  reason: string;
}


export interface WingmanMentionResult {
  wingman_message: string;
  suggestions: WingmanSuggestion[];
  follow_up_question: string;
}

export interface ItineraryStep {
  startTime: string;
  endTime: string;
  activityType: 'dining' | 'cafe' | 'entertainment' | 'travel';
  locationName: string;
  locationUrl: string;
  description: string;
  estimatedCost: number;
  recommendedItems: string[];
}

export interface ItineraryPlan {
  title: string;
  date: string;
  durationSummary: string;
  totalBudgetLimit: number;
  totalEstimatedCost: number;
  currency: string;
  steps: ItineraryStep[];
}

@Injectable()
export class WingmanService {
  private readonly logger = new Logger(WingmanService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(WingmanConversation)
    private readonly wingmanRepo: EntityRepository<WingmanConversation>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: EntityRepository<UserProfile>,
    @InjectRepository(Message)
    private readonly messageRepo: EntityRepository<Message>,
    @InjectRepository(Conversation)
    private readonly convRepo: EntityRepository<Conversation>,
    @InjectRepository(Participant)
    private readonly participantRepo: EntityRepository<Participant>,
    private readonly em: EntityManager,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set - Wingman AI will not work');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  /**
   * Get or create a wingman conversation for a user
   */
  async getOrCreateConversation(userId: string): Promise<WingmanConversation> {
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

  /**
   * Chat with the AI Wingman
   */
  async chat(
    userId: string,
    message: string,
    context?: { targetUserId?: string; chatContext?: string },
  ): Promise<{ reply: string; suggestions?: string[] }> {
    const conversation = await this.getOrCreateConversation(userId);
    
    // Get user's profile for context
    const userProfile = await this.profileRepo.findOne({ user: { id: userId } });
    
    // Get target's profile if specified
    let targetProfile: ProfileData | undefined;
    if (context?.targetUserId) {
      const target = await this.profileRepo.findOne({ user: { id: context.targetUserId } });
      if (target) {
        targetProfile = {
          display_name: target.display_name,
          bio: target.bio,
          tags: target.tags,
          occupation: target.occupation,
          intentMode: target.intentMode,
        };
      }
    }

    // Build conversation history for context
    const recentMessages = (conversation.messages || []).slice(-10);
    const historyText = recentMessages
      .map((m) => `${m.role === 'user' ? 'User' : 'Wingman'}: ${m.content}`)
      .join('\n');

    // Build the prompt
    const systemPrompt = this.buildSystemPrompt(userProfile, targetProfile, context?.chatContext);
    
    const prompt = `${systemPrompt}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}User: ${message}

Respond as the AI Wingman. Be helpful, encouraging, and give actionable dating advice. Keep responses concise (under 150 words). If the user is asking about a specific person, help them craft messages or understand signals.

At the end, if appropriate, include 2-3 quick-reply suggestions in this format:
[SUGGESTIONS]
- First suggestion
- Second suggestion
- Third suggestion
[/SUGGESTIONS]`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      let reply = result.response.text().trim();

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

      // Save messages to conversation
      const userMessage: WingmanMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      const assistantMessage: WingmanMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };

      conversation.messages = [...(conversation.messages || []), userMessage, assistantMessage];
      conversation.context = {
        ...conversation.context,
        profileData: userProfile ? {
          display_name: userProfile.display_name,
          bio: userProfile.bio,
          tags: userProfile.tags,
        } : undefined,
        matchData: targetProfile ? { 
          targetUserId: context?.targetUserId,
          targetName: targetProfile.display_name,
          commonTags: userProfile?.tags?.filter(t => targetProfile.tags?.includes(t)) 
        } : undefined,
      };

      await this.em.flush();

      return { reply, suggestions };
    } catch (error) {
      this.logger.error('Wingman chat failed:', error);
      return {
        reply: 'Xin lỗi, mình đang gặp sự cố. Thử lại sau nhé! 😅',
        suggestions: ['Thử lại', 'Hỏi điều khác'],
      };
    }
  }

  /**
   * Get profile improvement tips
   */
  async getProfileTips(userId: string): Promise<{
    tips: { category: string; tip: string; priority: 'high' | 'medium' | 'low' }[];
    overallScore: number;
  }> {
    const profile = await this.profileRepo.findOne({ user: { id: userId } });
    
    if (!profile) {
      return {
        tips: [{ category: 'general', tip: 'Hãy tạo profile để nhận tips nhé!', priority: 'high' }],
        overallScore: 0,
      };
    }

    const prompt = `You are a dating profile expert. Analyze this profile and give specific improvement tips.

Profile:
- Display Name: ${profile.display_name || 'Not set'}
- Bio: ${profile.bio || 'Not set'}
- Tags/Interests: ${profile.tags?.join(', ') || 'Not set'}
- Occupation: ${profile.occupation || 'Not set'}
- Looking for: ${profile.intentMode || 'Not specified'}
- Has Photos: ${profile.photos?.length || 0} photos

Give 3-5 specific, actionable tips to improve this profile for better matches. Focus on:
1. Bio quality (authenticity, hooks, conversation starters)
2. Photo advice
3. Interest tags optimization
4. Overall appeal

Respond in JSON format:
{
  "tips": [
    {"category": "bio", "tip": "...", "priority": "high|medium|low"},
    ...
  ],
  "overallScore": 0-100
}

Write tips in Vietnamese. Be encouraging but honest.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to get profile tips:', error);
      return {
        tips: [
          { category: 'general', tip: 'Thêm bio để người khác hiểu bạn hơn', priority: 'high' },
          { category: 'photos', tip: 'Thêm ít nhất 3 ảnh chất lượng', priority: 'high' },
          { category: 'interests', tip: 'Chọn tags thể hiện sở thích thật của bạn', priority: 'medium' },
        ],
        overallScore: 50,
      };
    }
  }

  /**
   * Generate icebreaker suggestions for a specific match
   */
  async getIcebreakers(
    userId: string,
    targetUserId: string,
  ): Promise<{ icebreakers: string[]; contextHints: string[] }> {
    const [userProfile, targetProfile] = await Promise.all([
      this.profileRepo.findOne({ user: { id: userId } }),
      this.profileRepo.findOne({ user: { id: targetUserId } }),
    ]);

    if (!targetProfile) {
      return {
        icebreakers: ['Hey! Rất vui được match với bạn 😊'],
        contextHints: [],
      };
    }

    // Find common interests
    const userTags = new Set(userProfile?.tags || []);
    const targetTags = targetProfile.tags || [];
    const commonTags = targetTags.filter((t) => userTags.has(t));

    const prompt = `Generate creative icebreaker messages for a dating app.

About the person I matched with:
- Name: ${targetProfile.display_name || 'Unknown'}
- Bio: ${targetProfile.bio || 'No bio'}
- Interests: ${targetTags.join(', ') || 'Unknown'}
- Occupation: ${targetProfile.occupation || 'Unknown'}
- Looking for: ${targetProfile.intentMode || 'Unknown'}

My interests: ${userProfile?.tags?.join(', ') || 'Unknown'}
Common interests: ${commonTags.join(', ') || 'None found'}

Generate 3-4 icebreaker messages that:
1. Reference something specific from their profile
2. Are playful and interesting (not just "Hi")
3. Ask a question or create engagement
4. Feel natural and not creepy

Also provide 2-3 "context hints" - observations about the match that could help start conversation.

Respond in JSON format:
{
  "icebreakers": ["message1", "message2", "message3"],
  "contextHints": ["hint1", "hint2"]
}

Write in Vietnamese. Be casual and fun.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to generate icebreakers:', error);
      return {
        icebreakers: [
          `Chào ${targetProfile.display_name || 'bạn'}! Thấy bạn cũng thích ${targetTags[0] || 'nhiều thứ hay ho'}, kể thêm đi! 😄`,
          'Profile của bạn đáng yêu ghê! Mình tò mò muốn biết thêm về bạn 🌟',
          'Hey! Bạn có vẻ thú vị - mình có thể hỏi bạn một câu được không? 😊',
        ],
        contextHints: commonTags.length > 0 
          ? [`Cả hai đều thích ${commonTags[0]}`]
          : ['Hãy hỏi về sở thích trong bio của họ'],
      };
    }
  }

  /**
   * Suggest a reply based on conversation context
   */
  async suggestReply(
    userId: string,
    conversationMessages: { sender: 'me' | 'them'; content: string }[],
    targetProfile?: ProfileData,
  ): Promise<{ suggestions: string[]; analysis: string }> {
    const userProfile = await this.profileRepo.findOne({ user: { id: userId } });

    const conversationText = conversationMessages
      .map((m) => `${m.sender === 'me' ? 'Me' : 'Them'}: ${m.content}`)
      .join('\n');

    const prompt = `You are a dating coach helping someone respond in a chat conversation.

The conversation so far:
${conversationText}

${targetProfile ? `About the person I'm chatting with:
- Name: ${targetProfile.display_name || 'Unknown'}
- Bio: ${targetProfile.bio || 'No bio'}
- Interests: ${targetProfile.tags?.join(', ') || 'Unknown'}` : ''}

Generate 3 possible reply suggestions that:
1. Match the conversation's tone and energy
2. Keep the conversation moving forward
3. Show genuine interest
4. Feel natural (not robotic)

Also provide a brief analysis of the conversation dynamics (are they interested? should I be more/less forward?).

Respond in JSON format:
{
  "suggestions": ["reply1", "reply2", "reply3"],
  "analysis": "brief analysis here"
}

Write in Vietnamese if the conversation is in Vietnamese.`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to suggest reply:', error);
      return {
        suggestions: [
          'Thật sao? Kể thêm đi! 😄',
          'Nghe hay quá! Mình cũng thích vậy',
          'Haha, bạn vui ghê! ☺️',
        ],
        analysis: 'Không thể phân tích cuộc hội thoại lúc này.',
      };
    }
  }

  /**
   * Get conversation history for a user
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

  /**
   * Generate first date ideas based on both profiles and chat history
   */
  async generateDateIdeas(
    userId: string,
    targetUserId: string,
    conversationId: string,
  ): Promise<DateIdeasResult> {
    const [userProfile, targetProfile] = await Promise.all([
      this.profileRepo.findOne({ user: { id: userId } }),
      this.profileRepo.findOne({ user: { id: targetUserId } }),
    ]);

    if (!userProfile || !targetProfile) {
      return {
        host_message: 'Cần cả hai hồ sơ để gợi ý hẹn hò nhé!',
        date_ideas: [],
        ice_breaker_offline: '',
      };
    }

    // Fetch last 20 messages from conversation
    const messages = await this.messageRepo.find(
      { conversation: { id: conversationId } },
      { orderBy: { seq: 'DESC' }, limit: 20 },
    );
    messages.reverse();

    const chatText = messages
      .map((m) => {
        const sender = m.sender_id === userId ? userProfile.display_name : targetProfile.display_name;
        const body = m.body?.length > 200 ? m.body.slice(0, 200) + '...' : m.body;
        return `${sender}: ${body}`;
      })
      .join('\n');

    const getMusicVibe = (profile: UserProfile) => {
      const s = profile.spotify as any;
      if (!s?.analysis) return 'chưa có';
      const a = s.analysis;
      return [a.mood, a.keywords?.join(', '), a.quote].filter(Boolean).join(' - ');
    };

    const prompt = `Bạn là "AI Wingman" (Chủ xị ghép đôi) cực kỳ tinh tế trên ứng dụng hẹn hò Peerzee.

Nhiệm vụ: Đọc kỹ hồ sơ và [Lịch sử trò chuyện gần đây] của hai người dùng. Từ những đoạn chat này, hãy "bắt bài" xem họ đang có hứng thú với chủ đề gì, món ăn nào, hay khu vực nào. Sau đó, gợi ý 2 ý tưởng hẹn hò tại TP.HCM thật "bám sát" vào nội dung họ vừa nói chuyện.

ĐIỀU KIỆN BẮT BUỘC:
1. Địa điểm gợi ý PHẢI CÓ THẬT và khớp với ngữ cảnh trò chuyện (VD: Họ đang bàn về mèo -> Gợi ý quán cafe mèo; Họ than đói -> Gợi ý quán ăn).
2. Tự động tạo link tìm kiếm Google Maps chính xác cho địa điểm đó.
3. Trong phần "why_it_matches", phải trích dẫn lại (hoặc nhắc lại) một ý cụ thể mà họ vừa chat để chứng minh AI rất hiểu họ.

[Profile User A]: ${userProfile.display_name || 'User A'} - Tags: ${userProfile.tags?.join(', ') || 'chưa rõ'}
[Profile User B]: ${targetProfile.display_name || 'User B'} - Tags: ${targetProfile.tags?.join(', ') || 'chưa rõ'}

[LỊCH SỬ TRÒ CHUYỆN GẦN ĐÂY]:
${chatText || 'Chưa có tin nhắn'}

Bạn PHẢI trả về kết quả dưới dạng JSON hợp lệ (KHÔNG markdown, KHÔNG giải thích thêm):

{
  "host_message": "Câu mở lời của AI xen vào cuộc trò chuyện, nhắc lại chủ đề họ đang nói để rủ đi chơi (VD: Thấy hai bạn đang thèm bún đậu, hay là triển luôn nhỉ?).",
  "date_ideas": [
    {
      "title": "Tên ý tưởng hẹn hò",
      "location": {
        "place_name": "Tên địa điểm có thật tại TP.HCM",
        "address": "Địa chỉ / Khu vực",
        "google_maps_url": "https://www.google.com/maps/search/?api=1&query={Tên+quán+và+địa+chỉ+viết+liền+bằng+dấu+cộng}"
      },
      "description": "Mô tả trải nghiệm buổi hẹn.",
      "why_it_matches": "Giải thích lý do chọn, BẮT BUỘC phải liên kết/trích dẫn nội dung tin nhắn họ vừa chat."
    }
  ]
}

Yêu cầu:
- Trả về đúng 2 date_ideas
- Địa điểm PHẢI CÓ THẬT, PHỔ BIẾN tại TP.HCM và KHỚP với ngữ cảnh chat
- google_maps_url đúng format: https://www.google.com/maps/search/?api=1&query= rồi nối tên+địa+chỉ bằng dấu +
- why_it_matches PHẢI trích dẫn hoặc nhắc lại ý cụ thể từ đoạn chat
- Tiếng Việt 100%, phong cách Gen-Z, casual`;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to generate date ideas:', error);
      return {
        host_message: 'Xin lỗi, mình đang gặp sự cố khi tạo gợi ý. Thử lại sau nhé!',
        date_ideas: [
          {
            title: 'Cafe & Chill',
            location: {
              place_name: 'The Coffee House - Signature',
              address: '2 Hai Bà Trưng, Quận 1',
              google_maps_url: 'https://www.google.com/maps/search/?api=1&query=The+Coffee+House+Signature+2+Hai+Ba+Trung+Quan+1',
            },
            description: 'Hẹn nhau ở một quán cafe nhỏ xinh, ngồi nói chuyện và tìm hiểu nhau thêm.',
            why_it_matches: 'Không gian yên tĩnh, dễ trò chuyện cho lần đầu gặp mặt.',
          },
        ],
        ice_breaker_offline: 'Hỏi nhau: "Ngoài đời bạn có giống ảnh profile không?" rồi cười xòa!',
      };
    }
  }

  /**
   * Handle @Wingman mention in chat - fetch context, call Gemini, return venue suggestions
   */
  async handleWingmanMention(
    conversationId: string,
    triggerUserId: string,
    triggerMessage: string,
  ): Promise<WingmanMentionResult> {
    // 1. Get conversation participants
    const participants = await this.participantRepo.find(
      { conversation: { id: conversationId } },
      { populate: ['user'] },
    );

    const userIds = participants.map((p) => p.user.id);

    // 2. Fetch both profiles
    const profiles = await this.profileRepo.find({
      user: { id: { $in: userIds } },
    });

    const userAProfile = profiles.find((p) => p.user?.id === triggerUserId) || profiles[0];
    const userBProfile = profiles.find((p) => p.user?.id !== triggerUserId) || profiles[1];

    // 3. Fetch last 15 messages
    const messages = await this.messageRepo.find(
      { conversation: { id: conversationId } },
      { orderBy: { seq: 'DESC' }, limit: 15 },
    );
    messages.reverse();

    // Build profile name map for chat history
    const profileMap = new Map<string, string>();
    for (const p of profiles) {
      if (p.user?.id) profileMap.set(p.user.id, p.display_name || 'User');
    }

    const chatHistoryText = messages
      .map((m) => {
        const name = profileMap.get(m.sender_id) || 'User';
        const body = m.body?.length > 200 ? m.body.slice(0, 200) + '...' : m.body;
        return `${name}: ${body}`;
      })
      .join('\n');

    // 4. Build prompt
    const userAName = userAProfile?.display_name || 'User A';
    const userATags = userAProfile?.tags?.join(', ') || 'chưa rõ';
    const userBName = userBProfile?.display_name || 'User B';
    const userBTags = userBProfile?.tags?.join(', ') || 'chưa rõ';

    const prompt = `Bạn là "@Wingman" - trợ lý AI ghép đôi trên ứng dụng Peerzee.
Nhiệm vụ: Đọc Lịch sử trò chuyện, hiểu ngữ cảnh và đề xuất đúng 2 địa điểm CÓ THẬT, CỤ THỂ tại TP.HCM. Tự động tạo link tìm kiếm Google Maps.
TRẢ VỀ STRICTLY JSON FORMAT, NO MARKDOWN:
{
  "wingman_message": "Câu nói duyên dáng khi xuất hiện trong chat.",
  "suggestions": [
    {
      "place_name": "Tên địa điểm (VD: Ốc Oanh)",
      "address": "Địa chỉ, Quận",
      "google_maps_url": "https://www.google.com/maps/search/?api=1&query={Ten_quan_va_Dia_chi_viet_lien_nhau_bang_dau_cong}",
      "reason": "Giải thích chi tiết lý do chọn quán này, BẮT BUỘC phải nhắc lại một chi tiết họ vừa nói trong lịch sử chat."
    }
  ],
  "follow_up_question": "Một câu hỏi vui mở đường chốt kèo."
}

[Hồ sơ User A]: ${userAName} - Sở thích: ${userATags}
[Hồ sơ User B]: ${userBName} - Sở thích: ${userBTags}

[Lịch sử trò chuyện gần đây]:
${chatHistoryText || 'Chưa có tin nhắn'}

[Yêu cầu của người dùng]:
${triggerMessage}`;

    // 5. Call Gemini
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Wingman AI response');
      }

      const parsed: WingmanMentionResult = JSON.parse(jsonMatch[0]);

      // Enrich each suggestion with real OSM coordinates (parallel)
      await Promise.all(
        parsed.suggestions.map(async (s) => {
          const osm = await this.searchPlacesOSM(`${s.place_name} ${s.address}`);
          if (osm) {
            s.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${osm.lat},${osm.lon}`;
            console.log(`[WINGMAN] ✅ Enriched "${s.place_name}" → ${s.google_maps_url}`);
          } else {
            console.log(`[WINGMAN] ⚠️ OSM failed for "${s.place_name}", keeping Gemini URL`);
          }
        }),
      );

      return parsed;
    } catch (error) {
      this.logger.error('Wingman mention failed:', error);
      return {
        wingman_message: 'Xin lỗi, Wingman đang bị lag! Thử gọi lại sau nhé 😅',
        suggestions: [
          {
            place_name: 'The Coffee House - Signature',
            address: '2 Hai Bà Trưng, Quận 1',
            google_maps_url: 'https://www.google.com/maps/search/?api=1&query=The+Coffee+House+Signature+2+Hai+Ba+Trung+Quan+1',
            reason: 'Quán cafe không bao giờ sai cho lần đầu gặp mặt!',
          },
        ],
        follow_up_question: 'Hai bạn thích ngồi trong hay ngoài trời?',
      };
    }
  }

  private async searchPlacesOSM(
    query: string,
  ): Promise<{ lat: string; lon: string; display_name: string } | null> {
    try {
      const encoded = encodeURIComponent(`${query}, Ho Chi Minh City`);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
      const response = await axios.get<{ lat: string; lon: string; display_name: string }[]>(url, {
        headers: { 'User-Agent': 'peerzee-app/1.0 (contact@peerzee.app)' },
        timeout: 5000,
      });
      if (response.data?.length > 0) {
        const { lat, lon, display_name } = response.data[0];
        console.log(`[OSM] ✅ "${query}" → lat=${lat} lon=${lon} | ${display_name}`);
        return { lat, lon, display_name };
      }
      this.logger.warn(`[OSM] ⚠️ No results for "${query}"`);
      return null;
    } catch (err) {
      this.logger.warn(`[OSM] Lookup failed for "${query}":`, err);
      return null;
    }
  }

  /**
   * Generate a structured dating itinerary using Gemini with JSON-forced output
   */
  async generateItinerary(
    userId: string,
    message: string,
    targetUserId?: string,
  ): Promise<ItineraryPlan> {
    const systemPrompt = `Bạn là chuyên gia lên kế hoạch hẹn hò tại TP. Hồ Chí Minh, Việt Nam.

Từ yêu cầu của người dùng, hãy trích xuất:
- Khung giờ (startTime / endTime). Nếu không có, mặc định 17:00–22:00.
- Ngân sách tối đa (totalBudgetLimit, VND). Nếu không có, dùng 500000.

QUAN TRỌNG: Chỉ trả về một JSON object hợp lệ — không markdown, không giải thích, không dấu \`\`\`.
Schema bắt buộc:
{
  "title": "Tên buổi hẹn sáng tạo",
  "date": "Thứ Bảy, 20/07",
  "durationSummary": "18:00 – 22:00 (4 tiếng)",
  "totalBudgetLimit": 500000,
  "totalEstimatedCost": 420000,
  "currency": "VND",
  "steps": [
    {
      "startTime": "18:00",
      "endTime": "19:30",
      "activityType": "cafe",
      "locationName": "The Workshop Coffee",
      "locationUrl": "https://www.google.com/maps/search/?api=1&query=The+Workshop+Coffee+Ho+Chi+Minh+City",
      "description": "Lý do ngắn gọn phù hợp vibe",
      "estimatedCost": 120000,
      "recommendedItems": ["Cà phê sữa đá", "Bánh croissant bơ"]
    },
    {
      "startTime": "19:35",
      "endTime": "19:45",
      "activityType": "travel",
      "locationName": "Di chuyển",
      "locationUrl": "",
      "description": "~10 phút di chuyển bằng Grab",
      "estimatedCost": 0,
      "recommendedItems": []
    }
  ]
}

Quy tắc bắt buộc:
1. Các bước PHẢI nằm trong khung giờ — endTime của bước cuối ≤ endTime tổng.
2. Thêm bước "travel" (activityType: "travel") giữa các địa điểm với thời gian di chuyển ước tính.
3. totalEstimatedCost = tổng estimatedCost tất cả bước, PHẢI ≤ totalBudgetLimit.
4. Giá ước tính thực tế tại Việt Nam: Cafe ~80k–150k/người, Ăn tối ~150k–350k/người, Vui chơi ~50k–200k, Di chuyển ~20k–50k.
5. 3–5 bước hoạt động thực sự (không tính bước travel).
6. locationUrl là Google Maps search URL, "" nếu là bước travel.
7. Toàn bộ tiếng Việt (trừ tên địa điểm tiếng Anh).
8. activityType chỉ được là: "dining", "cafe", "entertainment", "travel".
9. recommendedItems: với dining và cafe, gợi ý 1–2 món/đồ uống đặc trưng phù hợp vibe và ngân sách. Travel steps để mảng rỗng [].`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
      systemInstruction: systemPrompt,
    });

    let raw = result.response.text().trim();

    // Strip markdown code blocks if Gemini wraps the response
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let plan: ItineraryPlan;
    try {
      plan = JSON.parse(raw);
    } catch {
      this.logger.error('[Itinerary] Failed to parse Gemini JSON:', raw.slice(0, 200));
      throw new Error('Không thể tạo lịch trình. Vui lòng thử lại.');
    }

    // Always override locationUrl — never trust the LLM-generated URL
    await Promise.all(
      plan.steps.map(async (step) => {
        if (step.activityType === 'travel') {
          step.locationUrl = '';
          return;
        }
        const osm = await this.searchPlacesOSM(step.locationName);
        if (osm) {
          step.locationUrl = `https://www.google.com/maps/search/?api=1&query=${osm.lat},${osm.lon}`;
          this.logger.log(`[Itinerary] ✅ OSM pin for "${step.locationName}"`);
        } else {
          // Reliable text-search fallback built by us, not the LLM
          const q = encodeURIComponent(`${step.locationName}, Ho Chi Minh City`);
          step.locationUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
          this.logger.warn(`[Itinerary] ⚠️ OSM miss for "${step.locationName}", using text-search fallback`);
        }
      }),
    );

    return plan;
  }

  private buildSystemPrompt(
    userProfile: UserProfile | null,
    targetProfile?: ProfileData,
    chatContext?: string,
  ): string {
    let prompt = `You are "Wingman AI" - a fun, supportive dating coach assistant in the Peerzee dating app.

Your personality:
- Friendly, encouraging, and slightly playful
- Give practical, actionable advice
- Be honest but tactful
- Use Vietnamese primarily, but can switch to English if the user does
- Use appropriate emojis sparingly

About the user:`;

    if (userProfile) {
      prompt += `
- Name: ${userProfile.display_name || 'Unknown'}
- Bio: ${userProfile.bio || 'Not set'}
- Looking for: ${userProfile.intentMode || 'Not specified'}
- Interests: ${userProfile.tags?.join(', ') || 'Not set'}`;
    } else {
      prompt += '\n- Profile not available';
    }

    if (targetProfile) {
      prompt += `

The user is asking about/interested in someone:
- Name: ${targetProfile.display_name || 'Unknown'}
- Bio: ${targetProfile.bio || 'Not set'}
- Interests: ${targetProfile.tags?.join(', ') || 'Not set'}`;
    }

    if (chatContext) {
      prompt += `

Recent chat context between them:
${chatContext}`;
    }

    return prompt;
  }
}
