import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { WingmanConversation, WingmanMessage } from '../chat/entities/wingman-conversation.entity';
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

@Injectable()
export class WingmanService {
  private readonly logger = new Logger(WingmanService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(WingmanConversation)
    private readonly wingmanRepo: EntityRepository<WingmanConversation>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: EntityRepository<UserProfile>,
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
