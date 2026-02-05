import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserProfile } from '../user/entities/user-profile.entity';

export interface TopicSuggestion {
    topic: string;
    context: string;
    category: 'light' | 'deep' | 'playful' | 'romantic';
    emoji: string;
}

export interface SilenceDetectionResult {
    silenceDuration: number;
    shouldSuggest: boolean;
    suggestions?: TopicSuggestion[];
}

/**
 * TopicGeneratorService - Detect silence and generate conversation topics
 * 
 * Features:
 * 1. Detect silence in video calls (>5s)
 * 2. Generate personalized topics based on profiles
 * 3. Escalate from light → deep topics over time
 * 4. Track conversation flow and avoid repetition
 */
@Injectable()
export class TopicGeneratorService {
    private readonly logger = new Logger(TopicGeneratorService.name);
    private readonly genAI: GoogleGenerativeAI;
    
    // Track silence duration per session
    private silenceTrackers: Map<string, {
        lastActivityTime: number;
        silenceDuration: number;
        topicsSuggested: string[];
        conversationPhase: 'warmup' | 'getting-to-know' | 'deep-dive' | 'romantic';
    }> = new Map();

    // Silence threshold (5 seconds)
    private readonly SILENCE_THRESHOLD = 5000;
    
    // Time between suggestions (don't spam)
    private readonly SUGGESTION_COOLDOWN = 30000; // 30s

    constructor(
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
    ) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not set - Topic generation will not work');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
    }

    /**
     * Start tracking silence for a session
     */
    startTracking(sessionId: string): void {
        this.silenceTrackers.set(sessionId, {
            lastActivityTime: Date.now(),
            silenceDuration: 0,
            topicsSuggested: [],
            conversationPhase: 'warmup',
        });
        
        this.logger.log(`Started silence tracking for session ${sessionId}`);
    }

    /**
     * Record activity (speech, laughter, etc.)
     */
    recordActivity(sessionId: string): void {
        const tracker = this.silenceTrackers.get(sessionId);
        if (!tracker) return;

        tracker.lastActivityTime = Date.now();
        tracker.silenceDuration = 0;
        this.silenceTrackers.set(sessionId, tracker);
    }

    /**
     * Check for silence and generate topics if needed
     */
    async checkSilence(
        sessionId: string,
        user1Id: string,
        user2Id: string,
    ): Promise<SilenceDetectionResult> {
        const tracker = this.silenceTrackers.get(sessionId);
        if (!tracker) {
            return { silenceDuration: 0, shouldSuggest: false };
        }

        const now = Date.now();
        tracker.silenceDuration = now - tracker.lastActivityTime;

        // Check if silence exceeds threshold
        if (tracker.silenceDuration < this.SILENCE_THRESHOLD) {
            return { silenceDuration: tracker.silenceDuration, shouldSuggest: false };
        }

        // Check cooldown (don't suggest too frequently)
        const lastSuggestion = tracker.topicsSuggested[tracker.topicsSuggested.length - 1];
        if (lastSuggestion && (now - tracker.lastActivityTime) < this.SUGGESTION_COOLDOWN) {
            return { silenceDuration: tracker.silenceDuration, shouldSuggest: false };
        }

        // Generate topics
        const suggestions = await this.generateTopics(sessionId, user1Id, user2Id);

        return {
            silenceDuration: tracker.silenceDuration,
            shouldSuggest: true,
            suggestions,
        };
    }

    /**
     * Generate personalized conversation topics
     */
    private async generateTopics(
        sessionId: string,
        user1Id: string,
        user2Id: string,
    ): Promise<TopicSuggestion[]> {
        try {
            // Get profiles
            const [profile1, profile2] = await Promise.all([
                this.profileRepo.findOne({ user: { id: user1Id } }),
                this.profileRepo.findOne({ user: { id: user2Id } }),
            ]);

            if (!profile1 || !profile2) {
                return this.getDefaultTopics();
            }

            const tracker = this.silenceTrackers.get(sessionId)!;

            // Build context
            const context = this.buildContext(profile1, profile2, tracker);

            // Generate with Gemini
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            
            const prompt = `You are a dating coach helping two people have a great video call conversation.

Person 1:
- Name: ${profile1.display_name}
- Bio: ${profile1.bio || 'No bio'}
- Interests: ${profile1.tags?.join(', ') || 'None listed'}
- Occupation: ${profile1.occupation || 'Not specified'}

Person 2:
- Name: ${profile2.display_name}
- Bio: ${profile2.bio || 'No bio'}
- Interests: ${profile2.tags?.join(', ') || 'None listed'}
- Occupation: ${profile2.occupation || 'Not specified'}

Conversation Phase: ${tracker.conversationPhase}
Topics Already Suggested: ${tracker.topicsSuggested.join(', ') || 'None'}

The conversation has been silent for ${Math.round(tracker.silenceDuration / 1000)} seconds.

Generate 3 conversation topic suggestions to break the ice. Each topic should:
1. Be relevant to their profiles and interests
2. Be appropriate for the conversation phase
3. Be engaging and easy to start
4. Not repeat previously suggested topics

Return ONLY a JSON array:
[
  {
    "topic": "Ask about their recent trip to Da Lat",
    "context": "They mentioned traveling in their bio",
    "category": "light",
    "emoji": "🏔️"
  },
  ...
]

Categories: light, deep, playful, romantic`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            // Parse JSON
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions: TopicSuggestion[] = JSON.parse(jsonMatch[0]);
                
                // Track suggested topics
                suggestions.forEach(s => tracker.topicsSuggested.push(s.topic));
                this.silenceTrackers.set(sessionId, tracker);

                // Advance conversation phase
                this.advancePhase(sessionId);

                return suggestions;
            }

            return this.getDefaultTopics();
        } catch (error) {
            this.logger.error('Topic generation error:', error);
            return this.getDefaultTopics();
        }
    }

    /**
     * Build context for topic generation
     */
    private buildContext(profile1: UserProfile, profile2: UserProfile, tracker: any): string {
        const commonInterests = (profile1.tags || [])
            .filter(tag => (profile2.tags || []).includes(tag));

        let context = '';
        if (commonInterests.length > 0) {
            context += `Common interests: ${commonInterests.join(', ')}. `;
        }

        return context;
    }

    /**
     * Get default topics when AI fails
     */
    private getDefaultTopics(): TopicSuggestion[] {
        return [
            {
                topic: "What's the most interesting thing that happened to you this week?",
                context: 'General ice breaker',
                category: 'light',
                emoji: '✨',
            },
            {
                topic: 'If you could travel anywhere right now, where would you go?',
                context: 'Travel dreams',
                category: 'playful',
                emoji: '✈️',
            },
            {
                topic: "What's something you're passionate about that most people don't know?",
                context: 'Hidden passions',
                category: 'deep',
                emoji: '💫',
            },
        ];
    }

    /**
     * Advance conversation phase over time
     */
    private advancePhase(sessionId: string): void {
        const tracker = this.silenceTrackers.get(sessionId);
        if (!tracker) return;

        const phaseProgression: Array<typeof tracker.conversationPhase> = [
            'warmup',
            'getting-to-know',
            'deep-dive',
            'romantic',
        ];

        const currentIndex = phaseProgression.indexOf(tracker.conversationPhase);
        if (currentIndex < phaseProgression.length - 1) {
            tracker.conversationPhase = phaseProgression[currentIndex + 1];
            this.silenceTrackers.set(sessionId, tracker);
            this.logger.log(`Session ${sessionId} advanced to phase: ${tracker.conversationPhase}`);
        }
    }

    /**
     * Stop tracking silence
     */
    stopTracking(sessionId: string): void {
        this.silenceTrackers.delete(sessionId);
        this.logger.log(`Stopped silence tracking for session ${sessionId}`);
    }

    /**
     * Get current conversation phase
     */
    getConversationPhase(sessionId: string): string {
        return this.silenceTrackers.get(sessionId)?.conversationPhase || 'warmup';
    }
}
