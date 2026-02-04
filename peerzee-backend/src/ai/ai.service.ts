import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly genAI: GoogleGenerativeAI;
    private readonly fileManager: GoogleAIFileManager;
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('GEMINI_API_KEY not configured - AI features will be disabled');
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.fileManager = new GoogleAIFileManager(this.apiKey);
    }

    /**
     * Generate embedding vector for text using Gemini text-embedding-004
     * @param text Text to generate embedding for
     * @returns 768-dimensional vector
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            // Using older stable model to avoid 404 on v1beta
            const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
            const result = await model.embedContent(text);

            const embedding = result.embedding.values;

            // Validate embedding dimensions (embedding-001 = 768 dims)
            if (embedding.length !== 768) {
                this.logger.warn(`Unexpected embedding dimension: ${embedding.length}, expected 768`);
            }

            return embedding;
        } catch (error) {
            this.logger.error('Failed to generate embedding (API error), using MOCK vector for testing', error);
            // Fallback: Return mock 768-dim vector to allow DB testing
            return new Array(768).fill(0.1);
        }
    }

    /**
     * General purpose content generation with Gemini
     * @param prompt The prompt text
     * @param model Optional model name (defaults to gemini-2.5-flash)
     * @returns Generated text response
     */
    async generateContent(prompt: string, modelName: string = 'gemini-2.5-flash'): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            return result.response.text().trim();
        } catch (error) {
            this.logger.error('Failed to generate content:', error);
            throw error;
        }
    }

    /**
     * Generate a contextual icebreaker for two matched users
     * Uses profile data (bio, tags, intent) to create personalized conversation starter
     */
    async generateIcebreaker(
        profileA: { bio?: string; tags?: string[]; intentMode?: string; occupation?: string; display_name?: string },
        profileB: { bio?: string; tags?: string[]; intentMode?: string; occupation?: string; display_name?: string }
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const formatProfile = (p: typeof profileA, name: string) => {
                const parts: string[] = [];
                if (p.bio) parts.push(`Bio: "${p.bio}"`);
                if (p.tags?.length) parts.push(`Interests: ${p.tags.join(', ')}`);
                if (p.occupation) parts.push(`Job: ${p.occupation}`);
                if (p.intentMode) parts.push(`Looking for: ${p.intentMode === 'DATE' ? 'Dating' : p.intentMode === 'STUDY' ? 'Study buddy' : 'Friendship'}`);
                return parts.length > 0 ? parts.join('. ') : 'No profile info provided';
            };

            const prompt = `You are a witty, helpful dating/friendship coach (Wingman).

Profile A: ${formatProfile(profileA, 'A')}
Profile B: ${formatProfile(profileB, 'B')}

Generate ONE short, friendly, and engaging icebreaker question (Vietnamese) that connects their shared interests or contrasts their differences interestingly.

Requirements:
- Keep it casual and under 30 words
- Make it a question or conversation starter
- Language: Vietnamese
- Do NOT use quotes around the output
- Just output the icebreaker, no explanation`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const icebreaker = response.text().trim().replace(/^["']|["']$/g, '');

            this.logger.log(`Generated icebreaker for match`);
            return icebreaker;
        } catch (error) {
            this.logger.error('Failed to generate icebreaker', error);
            return 'Hai bạn có vẻ rất hợp nhau, hãy thử chào nhau xem! 👋';
        }
    }

    /**
     * 🎬 AI DATING HOST: Generate conversation topics for blind video date
     * Used by the "AI Host" to moderate and keep the conversation flowing
     */
    async generateDateTopic(
        profileA: { bio?: string; tags?: string[]; intentMode?: string; occupation?: string; display_name?: string },
        profileB: { bio?: string; tags?: string[]; intentMode?: string; occupation?: string; display_name?: string },
        previousTopics: string[] = [],
        silenceRescue: boolean = false,
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const formatProfile = (p: typeof profileA) => {
                const parts: string[] = [];
                if (p.display_name) parts.push(`Name: ${p.display_name}`);
                if (p.occupation) parts.push(`Job: ${p.occupation}`);
                if (p.tags?.length) parts.push(`Interests: ${p.tags.slice(0, 5).join(', ')}`);
                if (p.bio) parts.push(`Bio: "${p.bio.slice(0, 100)}"`);
                return parts.length > 0 ? parts.join('. ') : 'No info';
            };

            const previousTopicsText = previousTopics.length > 0
                ? `\n\nPrevious topics (DON'T repeat): ${previousTopics.join('; ')}`
                : '';

            const urgencyHint = silenceRescue
                ? '\n\n⚠️ URGENT: The conversation has gone silent! Generate a FUN, easy-to-answer question to rescue them.'
                : '';

            const prompt = `You are the AI Host (MC) of a blind video dating show called "Peerzee Blind Date".

Two strangers are on a video call with blurred faces. Your job is to give them conversation topics.

Profile A: ${formatProfile(profileA)}
Profile B: ${formatProfile(profileB)}
${previousTopicsText}${urgencyHint}

Generate ONE engaging conversation topic card (Vietnamese). The topic should:
- Be a fun, engaging question or hypothetical scenario
- Bridge their common interests OR create playful contrast
- Be easy to answer (not too deep for a first meeting)
- Feel like a TV dating show moment

Format: Just the topic text, no quotes, no emoji at start, under 40 words.

Examples of good topics:
- Nếu có 1 tỷ đồng, bạn sẽ mở quán cafe hay all-in crypto?
- Ai là nghệ sĩ mà bạn sẽ đi xem concert dù vé 10 triệu?
- Một ngày hoàn hảo của bạn bắt đầu như thế nào?`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const topic = response.text().trim().replace(/^["']|["']$/g, '');

            this.logger.log(`Generated date topic${silenceRescue ? ' (silence rescue)' : ''}`);
            return topic;
        } catch (error) {
            this.logger.error('Failed to generate date topic', error);
            // Fallback topics
            const fallbacks = [
                'Nếu phải chọn một siêu năng lực, bạn muốn gì: bay hay đọc suy nghĩ?',
                'Kể về chuyến du lịch đáng nhớ nhất của bạn?',
                'Món ăn nào bạn có thể ăn cả tuần không chán?',
                'Nếu có time machine, bạn về quá khứ hay tới tương lai?',
                'Một bộ phim/series thay đổi cách bạn nghĩ về cuộc sống?',
            ];
            return fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
    }

    /**
     * 🎬 AI DATING HOST: Generate welcome message introducing both users
     */
    async generateBlindDateIntro(
        profileA: { display_name?: string; occupation?: string; tags?: string[]; location?: string },
        profileB: { display_name?: string; occupation?: string; tags?: string[]; location?: string },
    ): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // Find common tags
            const tagsA = new Set(profileA.tags || []);
            const tagsB = new Set(profileB.tags || []);
            const commonTags = [...tagsA].filter(t => tagsB.has(t));

            const prompt = `You are the charming AI Host of "Peerzee Blind Date" show.

Two people just matched:
- Person A: ${profileA.display_name || 'Guest'}, ${profileA.occupation || 'mysterious stranger'}${profileA.location ? `, from ${profileA.location}` : ''}
- Person B: ${profileB.display_name || 'Guest'}, ${profileB.occupation || 'mysterious stranger'}${profileB.location ? `, from ${profileB.location}` : ''}
${commonTags.length > 0 ? `Common interests: ${commonTags.join(', ')}` : ''}

Generate a SHORT, warm welcome message (Vietnamese) for both of them. Include:
- A playful, TV-show style greeting
- Mention 1-2 things they have in common (job field, interests, location)
- Tease that faces are blurred and will reveal based on chemistry

Keep it under 50 words. No emojis at the start. Casual and fun tone.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const intro = response.text().trim().replace(/^["']|["']$/g, '');

            this.logger.log('Generated blind date intro');
            return intro;
        } catch (error) {
            this.logger.error('Failed to generate blind date intro', error);
            return 'Chào mừng hai bạn đến với Peerzee Blind Date! Các bạn có vẻ rất hợp nhau đấy. Hãy bắt đầu trò chuyện nhé - mặt sẽ dần hiện ra khi chemistry tăng lên! 🎭';
        }
    }

    /**
     * Generate profile embedding from profile data
     * Serializes profile fields into structured text for embedding
     * Includes hidden_keywords for enriched search
     */
    async generateProfileEmbedding(profile: {
        intentMode?: string;
        occupation?: string;
        bio?: string;
        tags?: string[];
        hidden_keywords?: string[]; // AI-extracted enrichment
        education?: string;
        location?: string;
        prompts?: { question: string; answer: string }[];
    }): Promise<number[]> {
        const parts: string[] = [];

        if (profile.intentMode) parts.push(`Intent: ${profile.intentMode}`);
        if (profile.occupation) parts.push(`Job: ${profile.occupation}`);
        if (profile.bio) parts.push(`Bio: ${profile.bio}`);
        if (profile.tags?.length) parts.push(`Tags: ${profile.tags.join(', ')}`);
        if (profile.hidden_keywords?.length) parts.push(`Keywords: ${profile.hidden_keywords.join(', ')}`);
        if (profile.education) parts.push(`Education: ${profile.education}`);
        if (profile.location) parts.push(`Location: ${profile.location}`);
        if (profile.prompts?.length) {
            parts.push(`Prompts: ${profile.prompts.map(p => `${p.question}: ${p.answer}`).join('. ')}`);
        }

        const profileText = parts.join('. ');

        if (!profileText.trim()) {
            this.logger.warn('Empty profile text, cannot generate embedding');
            return [];
        }

        return this.generateEmbedding(profileText);
    }

    /**
     * Extract structured search filters from natural language query
     * Uses Gemini to parse queries like "Tìm bạn nữ học AI ở Hà Nội"
     */
    async extractSearchFilters(userQuery: string): Promise<SearchFilters> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const prompt = `Analyze this search query for a social/dating app: "${userQuery}"

Extract structured data into JSON:
- gender: "MALE" | "FEMALE" | null. 
  CRITICAL: ONLY extract if the user EXPLICITLY mentions a gender preference (e.g., "tìm bạn nữ", "looking for a girl"). 
  Otherwise, return null.
- city: string | null.
  CRITICAL: ONLY extract if a city is EXPLICITLY mentioned (e.g., "ở Hà Nội", "in Saigon"). 
  Otherwise, return null. DO NOT guess.
- intent: "FRIEND" | "DATE" | "STUDY" | null.
- semantic_text: string. Briefly translate interests to English keywords for better search.

Return ONLY raw JSON, no markdown, no explanation.`;

            const result = await model.generateContent(prompt);
            const response = result.response.text().trim();

            // Clean up response (remove markdown if present)
            let jsonStr = response;
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const parsed = JSON.parse(jsonStr);

            return {
                gender: parsed.gender || null,
                city: parsed.city || null,
                intent: parsed.intent || null,
                semantic_text: parsed.semantic_text || userQuery,
            };
        } catch (error) {
            this.logger.error('Failed to extract search filters', error);
            // Fallback: use the raw query as semantic text
            return {
                gender: null,
                city: null,
                intent: null,
                semantic_text: userQuery,
            };
        }
    }

    /**
     * Auto-extract hidden keywords from bio using Gemini
     * Enriches sparse bios like "Mình là dev" with inferred tags
     * @param bio User bio text
     * @param occupation Optional occupation for context
     * @returns Array of inferred keywords (bilingual EN/VN)
     */
    async extractKeywordsFromBio(bio: string, occupation?: string): Promise<string[]> {
        try {
            if (!bio || bio.trim().length < 3) {
                return [];
            }

            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `Analyze this user profile and extract hidden/implied keywords for search matching.

Bio: "${bio}"
${occupation ? `Occupation: "${occupation}"` : ''}

Task:
1. Infer related keywords that are NOT explicitly stated but can be reasonably assumed
2. Include both English and Vietnamese keywords
3. Focus on: profession, skills, interests, lifestyle, personality traits
4. Return 5-10 relevant keywords

Examples:
- "Mình là dev" → ["programming", "lập trình", "software", "coding", "developer", "tech", "công nghệ"]
- "Thích đi phượt" → ["travel", "du lịch", "adventure", "phượt", "motorcycle", "explorer", "backpacker"]
- "Gym rat 🏋️" → ["fitness", "gym", "workout", "bodybuilding", "healthy", "thể dục", "athlete"]

Return ONLY a JSON array of strings, no explanation. Example: ["keyword1", "keyword2", "keyword3"]`;

            const result = await model.generateContent(prompt);
            const response = result.response.text().trim();

            // Parse JSON array - handle markdown code blocks
            let keywords: string[] = [];
            let jsonStr = response;
            // Remove markdown code block if present
            if (jsonStr.includes('```')) {
                jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            }

            keywords = JSON.parse(jsonStr);

            if (!Array.isArray(keywords)) {
                return [];
            }

            this.logger.log(`Extracted ${keywords.length} hidden keywords from bio`);
            return keywords.slice(0, 10); // Max 10 keywords
        } catch (error) {
            this.logger.error('Failed to extract keywords from bio', error);
            return [];
        }
    }
    /**
     * Analyze user profile to provide score, roast, advice, and improvements
     * Uses Gemini to generate "Profile Doctor" feedback
     */
    async analyzeProfile(profile: {
        display_name?: string;
        bio?: string;
        occupation?: string;
        tags?: string[];
        intentMode?: string;
        age?: number;
    }): Promise<import('./dto/profile-analysis.dto').ProfileAnalysisResult> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); // Use 2.0 Flash for speed/quality balance

            // Handle potential null/undefined values gracefully
            const profileData = {
                name: profile.display_name || 'Anonymous',
                bio: profile.bio || 'Chưa viết bio (Empty)',
                job: profile.occupation || 'Thất nghiệp (Unknown)',
                tags: profile.tags?.length ? profile.tags.join(', ') : 'Không có sở thích (None)',
                intent: profile.intentMode || 'Unknown',
                age: profile.age || 'Unknown',
            };

            const prompt = `
    You are a professional, brutally honest, yet helpful Dating Profile Coach (Vietnamese context).
    Your job is to roast the user's profile to motivate them, then provide constructive fixes.

    Analyze this dating profile:
    - Name: ${profileData.name}
    - Age: ${profileData.age}
    - Bio: "${profileData.bio}"
    - Job: ${profileData.job}
    - Interests/Tags: ${profileData.tags}
    - Intent: ${profileData.intent}

    Output strictly in JSON format with the following keys:
    - score: number (0-100 based on profile quality, completeness, and attractiveness)
    - roast: string (A funny, slightly mean, spicy critique in Vietnamese. Be creative! ~1-2 sentences)
    - advice: string (One actionable, constructive tip to improve the profile in Vietnamese)
    - improved_bios: string[] (Array of 3 distinct bio options in Vietnamese: 1. Witty/Funny, 2. Professional/Sincere, 3. Mysterious/Cool)

    Constraint: Return ONLY raw JSON. No markdown formatting (no \`\`\`json).
    Example JSON:
    {
      "score": 45,
      "roast": "Profile của bạn nhạt hơn cả nước ốc, bio thì viết cho có.",
      "advice": "Hãy thêm chút muối vào bio và chọn ảnh đẹp hơn.",
      "improved_bios": ["Bio option 1...", "Bio option 2...", "Bio option 3..."]
    }
    `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();

            // Clean up potentially md formatted response
            let jsonStr = responseText;
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const analysis = JSON.parse(jsonStr);

            return {
                score: analysis.score || 0,
                roast: analysis.roast || 'AI đang bận đi hẹn hò nên chưa roast được bạn.',
                advice: analysis.advice || 'Hãy cập nhật profile đầy đủ hơn nhé.',
                improved_bios: Array.isArray(analysis.improved_bios) ? analysis.improved_bios : [],
            };
        } catch (error) {
            this.logger.error('Failed to analyze profile', error);
            // Fallback response in case of error
            return {
                score: 50,
                roast: 'AI bị lỗi khi đọc profile của bạn, chắc do profile "ảo" quá.',
                advice: 'Thử lại sau nhé!',
                improved_bios: [],
            };
        }
    }

    /**
     * Generate a conversation topic for Blind Date mode
     * Returns a fun, engaging question in Vietnamese
     */
    async generateConversationTopic(): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `Generate ONE engaging, deep, or fun conversation starter question for a first date (Vietnamese context).

Requirements:
- Short: under 20 words
- In Vietnamese language
- Can be funny, deep, or playful
- Should spark interesting conversation
- Do NOT use quotes around the output
- Just output the question, nothing else

Examples of good topics:
- Nếu được du lịch bất kỳ đâu ngay bây giờ, bạn sẽ chọn nơi nào?
- Món ăn nào khiến bạn hạnh phúc nhất?
- Bạn tin vào tình yêu sét đánh không?
- Điều gì khiến bạn cười nhiều nhất gần đây?`;

            const result = await model.generateContent(prompt);
            const topic = result.response.text().trim().replace(/^["']|["']$/g, '');

            this.logger.log(`Generated conversation topic: ${topic}`);
            return topic;
        } catch (error) {
            this.logger.error('Failed to generate conversation topic', error);
            // Fallback topics
            const fallbackTopics = [
                'Nếu có thể học một kỹ năng mới ngay lập tức, bạn sẽ chọn gì?',
                'Bạn thích mùa nào nhất trong năm và tại sao?',
                'Điều gì làm bạn hào hứng nhất về cuộc sống hiện tại?',
                'Nếu được quay về quá khứ, bạn muốn gặp ai?',
                'Bạn có sở thích bí mật nào không?',
            ];
            return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
        }
    }

    /**
     * Generate contextual reply suggestions based on chat history and partner profile
     * Used for "Conversation Rescuer" feature
     */
    async generateReplySuggestions(
        chatHistory: { sender: string; body: string }[],
        partnerProfile: { bio?: string; tags?: string[]; occupation?: string; display_name?: string },
        currentUserId: string,
    ): Promise<string[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            // Format chat history
            const historyText = chatHistory
                .map(msg => `${msg.sender === currentUserId ? 'Bạn' : 'Đối phương'}: ${msg.body}`)
                .join('\n');

            // Format partner info
            const partnerInfo = [
                partnerProfile.display_name ? `Tên: ${partnerProfile.display_name}` : '',
                partnerProfile.bio ? `Bio: ${partnerProfile.bio}` : '',
                partnerProfile.occupation ? `Nghề nghiệp: ${partnerProfile.occupation}` : '',
                partnerProfile.tags?.length ? `Sở thích: ${partnerProfile.tags.join(', ')}` : '',
            ].filter(Boolean).join('\n');

            const prompt = `Bạn là trợ lý hẹn hò thông minh. Phân tích cuộc trò chuyện và gợi ý câu hỏi tiếp theo.

=== LỊCH SỬ CHAT ===
${historyText || 'Chưa có tin nhắn'}

=== THÔNG TIN ĐỐI PHƯƠNG ===
${partnerInfo || 'Không có thông tin'}

=== NHIỆM VỤ ===
Tạo 3 câu hỏi/tin nhắn tiếp theo cho người dùng gửi cho đối phương.

Quy tắc:
1. Câu hỏi phải LIÊN QUAN đến nội dung đã nói trong chat (nếu có)
2. Nếu chat im lặng, dựa vào sở thích/nghề nghiệp của đối phương để hỏi
3. Ngắn gọn, tự nhiên, thân thiện (< 30 từ mỗi câu)
4. Tiếng Việt, không formal quá
5. KHÔNG hỏi những câu chung chung như "Bạn khỏe không?", "Bạn đang làm gì?"
6. Ưu tiên câu hỏi về chi tiết cụ thể từ cuộc trò chuyện

Trả về CHỈNH JSON array, không markdown:
["Câu gợi ý 1", "Câu gợi ý 2", "Câu gợi ý 3"]`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            // Clean up markdown if present
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const suggestions = JSON.parse(responseText);

            if (!Array.isArray(suggestions) || suggestions.length === 0) {
                throw new Error('Invalid response format');
            }

            this.logger.log(`Generated ${suggestions.length} reply suggestions`);
            return suggestions.slice(0, 3);
        } catch (error) {
            this.logger.error('Failed to generate reply suggestions', error);
            // Fallback suggestions
            return [
                'Dạo này bạn có đi đâu chơi không?',
                'Cuối tuần này bạn có kế hoạch gì chưa?',
                'Bạn thích loại nhạc nào nhất?',
            ];
        }
    }

    /**
     * Analyze music vibe from song, artist, and Spotify audio features
     * Returns mood, color, keywords, quote, description, and match_vibe
     * Used for "Vibe Match" feature with real Spotify data
     */
    async analyzeMusicVibe(
        song: string,
        artist: string,
        audioFeatures?: SpotifyAudioFeatures | null,
    ): Promise<MusicVibeResult> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            // Build audio features description if available
            let audioFeaturesText = '';
            if (audioFeatures) {
                audioFeaturesText = `
Spotify Audio Features (0.0-1.0 scale unless noted):
- Energy: ${audioFeatures.energy.toFixed(2)} (intensity/activity)
- Valence: ${audioFeatures.valence.toFixed(2)} (musical positiveness, 1.0 = happy)
- Danceability: ${audioFeatures.danceability.toFixed(2)} (suitability for dancing)
- Acousticness: ${audioFeatures.acousticness.toFixed(2)} (acoustic vs electronic)
- Instrumentalness: ${audioFeatures.instrumentalness.toFixed(2)} (vocal vs instrumental)
- Tempo: ${audioFeatures.tempo.toFixed(0)} BPM
- Loudness: ${audioFeatures.loudness.toFixed(1)} dB
- Mode: ${audioFeatures.mode === 1 ? 'Major (bright)' : 'Minor (dark)'}`;
            }

            const prompt = `You are a Music Psychologist & Vibe Analyst. Analyze this song's emotional signature.

Song: "${song}"
Artist: "${artist}"
${audioFeaturesText}

Task: Based on the song title, artist style, ${audioFeatures ? 'AND the Spotify audio features data,' : ''} determine the listener's personality "Vibe".

${audioFeatures ? `
IMPORTANT: Use the audio features to inform your analysis:
- High Energy (>0.7) + High Valence (>0.6) = Energetic, Happy vibes
- Low Energy (<0.4) + Low Valence (<0.4) = Melancholic, Introspective vibes
- High Energy + Low Valence = Angry, Rebellious, or Intense vibes
- Low Energy + High Valence = Chill, Peaceful vibes
- High Danceability (>0.7) = Playful, Social person
- High Acousticness (>0.6) = Authentic, Raw, Emotional preference
- Minor Mode = More complex/bittersweet emotions
` : ''}

Return a JSON object with:
- mood: string (one of: 'Chill', 'Energetic', 'Melancholic', 'Romantic', 'Nostalgic', 'Rebellious', 'Dreamy', 'Confident', 'Playful', 'Introspective', 'Melancholic High', 'Chill Lo-fi', 'Party Animal', 'Deep Thinker')
- color: string (Hex color that MATCHES the mood. Use Spotify green #1DB954 only for very energetic/positive. Examples: #FF6B6B passionate, #6C5CE7 dreamy, #00CEC9 chill, #2D3436 dark/melancholic)
- keywords: string[] (exactly 3 adjectives describing the listener's personality in Vietnamese)
- quote: string (A deep, meaningful line that fits this mood, in Vietnamese, 10-20 words. Can be poetic.)
- description: string (Why does this person listen to this song? What does it say about them? In Vietnamese, 20-40 words)
- match_vibe: string (What kind of person would vibe with this listener? In Vietnamese, 15-25 words)

Color-Mood Guidelines:
- Chill/Lo-fi: #00CEC9, #74B9FF, #81ECEC
- Energetic/Party: #1DB954, #FF7675, #FDCB6E
- Melancholic/Sad: #636E72, #2D3436, #6C5CE7
- Romantic: #FD79A8, #E17055, #FF6B6B
- Nostalgic: #FFEAA7, #DFE6E9, #A0522D
- Dreamy: #A29BFE, #81ECEC, #DDA0DD
- Confident/Bold: #E84393, #00B894, #E74C3C
- Introspective/Deep: #34495E, #8E44AD, #2C3E50

Return ONLY raw JSON, no markdown formatting.`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            // Clean up markdown if present
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const analysis = JSON.parse(responseText);

            // Validate and sanitize
            const validMoods = [
                'Chill', 'Energetic', 'Melancholic', 'Romantic', 'Nostalgic',
                'Rebellious', 'Dreamy', 'Confident', 'Playful', 'Introspective',
                'Melancholic High', 'Chill Lo-fi', 'Party Animal', 'Deep Thinker'
            ];
            const mood = validMoods.includes(analysis.mood) ? analysis.mood : 'Chill';
            const color = /^#[0-9A-Fa-f]{6}$/.test(analysis.color) ? analysis.color : '#6C5CE7';

            this.logger.log(`Analyzed music vibe for "${song}" by ${artist}: ${mood} (${color})`);

            return {
                mood,
                color,
                keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 3) : ['thú vị', 'độc đáo', 'sâu lắng'],
                quote: analysis.quote || 'Âm nhạc phản ánh tâm hồn của bạn',
                description: analysis.description || 'Người nghe có gu âm nhạc đặc biệt.',
                match_vibe: analysis.match_vibe || 'Hợp với người có gu âm nhạc tương tự',
            };
        } catch (error) {
            this.logger.error('Failed to analyze music vibe', error);
            // Fallback result
            return {
                mood: 'Chill',
                color: '#6C5CE7',
                keywords: ['bình yên', 'thư giãn', 'thoải mái'],
                quote: 'Âm nhạc là ngôn ngữ của tâm hồn',
                description: 'Bạn có gu âm nhạc riêng biệt và thích khám phá.',
                match_vibe: 'Hợp với người yêu thích sự bình yên và tận hưởng cuộc sống',
            };
        }
    }

    /**
     * Analyze audio vibe by listening to the actual audio file using Gemini multimodal
     * Downloads the audio preview, uploads to Gemini, and analyzes mood/vibe
     * Used for "Vibe Match" feature with iTunes/real audio
     */
    async analyzeAudioVibe(previewUrl: string, songName: string): Promise<AudioVibeResult> {
        let tempFilePath: string | null = null;

        try {
            this.logger.log(`Analyzing audio vibe for "${songName}" from ${previewUrl}`);

            // 1. Download audio preview as buffer
            const response = await axios.get(previewUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; PeerzeeBot/1.0)',
                },
            });

            const audioBuffer = Buffer.from(response.data);
            this.logger.log(`Downloaded ${audioBuffer.length} bytes of audio`);

            // 2. Save to temp file (required by GoogleAIFileManager)
            const tempDir = os.tmpdir();
            const fileName = `peerzee_audio_${Date.now()}.m4a`;
            tempFilePath = path.join(tempDir, fileName);
            fs.writeFileSync(tempFilePath, audioBuffer);
            this.logger.log(`Saved temp audio file: ${tempFilePath}`);

            // 3. Upload to Gemini File API
            const uploadResult = await this.fileManager.uploadFile(tempFilePath, {
                mimeType: 'audio/mp4', // iTunes previews are M4A (AAC in MP4 container)
                displayName: songName,
            });

            this.logger.log(`Uploaded to Gemini: ${uploadResult.file.name}, state: ${uploadResult.file.state}`);

            // 4. Wait for file to be processed (if needed)
            let file = uploadResult.file;
            while (file.state === 'PROCESSING') {
                this.logger.log('Waiting for audio processing...');
                await new Promise((resolve) => setTimeout(resolve, 2000));
                file = await this.fileManager.getFile(file.name);
            }

            if (file.state === 'FAILED') {
                throw new Error('Audio file processing failed');
            }

            // 5. Generate content with audio + prompt
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `Listen carefully to this song snippet ("${songName}"). 

Analyze the following aspects:
1. Melody & Harmony: Is it uplifting, melancholic, intense, dreamy?
2. Rhythm & Tempo: Fast/slow? Danceable? Relaxing?
3. Mood & Emotion: What feelings does it evoke?
4. Energy Level: High energy or low energy?
5. Atmosphere: Romantic, party, chill, introspective?

Based on your analysis, return a JSON object with:
- mood: string (Choose ONE that best fits: 'Chill', 'Energetic', 'Melancholic', 'Romantic', 'Nostalgic', 'Rebellious', 'Dreamy', 'Confident', 'Playful', 'Introspective', 'Party', 'Lo-fi', 'Epic', 'Peaceful')
- color: string (Hex color code that MATCHES the mood. Examples: #1DB954 energetic green, #6C5CE7 dreamy purple, #FF6B6B passionate red, #00CEC9 chill teal, #2D3436 dark moody, #FD79A8 romantic pink, #FDCB6E happy yellow)
- keywords: string[] (Exactly 3 Vietnamese adjectives describing someone who listens to this)
- description: string (Vietnamese, 20-40 words: What does this song say about the listener's personality and vibe? Be creative and insightful)

Return ONLY raw JSON, no markdown formatting.`;

            const result = await model.generateContent([
                {
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri,
                    },
                },
                { text: prompt },
            ]);

            let responseText = result.response.text().trim();
            this.logger.log(`Gemini audio analysis response: ${responseText.substring(0, 200)}...`);

            // Clean up markdown if present
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const analysis = JSON.parse(responseText);

            // Validate mood
            const validMoods = [
                'Chill', 'Energetic', 'Melancholic', 'Romantic', 'Nostalgic',
                'Rebellious', 'Dreamy', 'Confident', 'Playful', 'Introspective',
                'Party', 'Lo-fi', 'Epic', 'Peaceful'
            ];
            const mood = validMoods.includes(analysis.mood) ? analysis.mood : 'Chill';
            const color = /^#[0-9A-Fa-f]{6}$/.test(analysis.color) ? analysis.color : '#6C5CE7';

            this.logger.log(`Audio vibe analyzed for "${songName}": ${mood} (${color})`);

            // 6. Clean up: Delete uploaded file from Gemini
            try {
                await this.fileManager.deleteFile(file.name);
                this.logger.log(`Deleted Gemini file: ${file.name}`);
            } catch (deleteError) {
                this.logger.warn(`Failed to delete Gemini file: ${file.name}`);
            }

            return {
                mood,
                color,
                keywords: Array.isArray(analysis.keywords) ? analysis.keywords.slice(0, 3) : ['thú vị', 'độc đáo', 'sâu sắc'],
                description: analysis.description || 'Bạn có gu âm nhạc đặc biệt và thích khám phá âm thanh mới.',
            };
        } catch (error) {
            this.logger.error('Failed to analyze audio vibe', error);

            // Fallback to text-based analysis if audio fails
            this.logger.log('Falling back to text-based analysis...');
            const textAnalysis = await this.analyzeMusicVibe(songName, '', null);

            return {
                mood: textAnalysis.mood,
                color: textAnalysis.color,
                keywords: textAnalysis.keywords,
                description: textAnalysis.description,
            };
        } finally {
            // Clean up temp file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                    this.logger.log(`Deleted temp file: ${tempFilePath}`);
                } catch (e) {
                    this.logger.warn(`Failed to delete temp file: ${tempFilePath}`);
                }
            }
        }
    }

    /**
     * 🔮 THE ORACLE: Analyze compatibility between two users
     * Returns Synergy Score, Combo Breakers (conflicts), and Critical Hits (common ground)
     * Used for smart matching with RPG persona
     */
    async analyzeCompatibility(
        userProfile: { interests?: string[]; bio?: string; occupation?: string; intentMode?: string; tags?: string[] },
        targetProfile: { interests?: string[]; bio?: string; occupation?: string; intentMode?: string; tags?: string[] },
    ): Promise<CompatibilityResult> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const formatProfile = (p: typeof userProfile, name: string) => {
                const parts: string[] = [];
                if (p.bio) parts.push(`Bio: "${p.bio}"`);
                if (p.interests?.length) parts.push(`Interests: ${p.interests.join(', ')}`);
                if (p.tags?.length) parts.push(`Tags: ${p.tags.join(', ')}`);
                if (p.occupation) parts.push(`Occupation: ${p.occupation}`);
                if (p.intentMode) parts.push(`Looking for: ${p.intentMode}`);
                return parts.length > 0 ? parts.join('. ') : 'No info provided';
            };

            const prompt = `You are THE ORACLE of Peerzee - an ancient, wise entity who sees the threads of destiny between souls.

Compare these two adventurers:

🎮 Player A: ${formatProfile(userProfile, 'A')}

🎮 Player B: ${formatProfile(targetProfile, 'B')}

Your sacred duty:
1. Calculate a "Synergy Score" (0-100%) based on their compatibility
2. Identify "Combo Breakers" 💥 - Conflicting traits that could cause friction
3. Identify "Critical Hits" ⚔️ - Common grounds that create strong bonds

Speak in the voice of a mystical oracle from an RPG game. Be wise, slightly mysterious, but helpful.

Return ONLY this JSON (no markdown):
{
  "score": <number 0-100>,
  "analysis": "<Vietnamese oracle-style analysis, 2-3 sentences, mystical but readable>",
  "common_ground": ["<shared trait 1>", "<shared trait 2>", ...],
  "combo_breakers": ["<conflict 1>", "<conflict 2>", ...],
  "oracle_verdict": "<A short, memorable Vietnamese phrase summarizing the match, like a fortune cookie>"
}`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            // Clean up markdown if present
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const analysis = JSON.parse(responseText);

            this.logger.log(`Oracle analyzed compatibility: ${analysis.score}%`);

            return {
                score: Math.min(100, Math.max(0, analysis.score || 50)),
                analysis: analysis.analysis || 'Số mệnh của hai bạn đang được viết lên các vì sao...',
                common_ground: Array.isArray(analysis.common_ground) ? analysis.common_ground : [],
                combo_breakers: Array.isArray(analysis.combo_breakers) ? analysis.combo_breakers : [],
                oracle_verdict: analysis.oracle_verdict || 'Hãy để thời gian trả lời...',
            };
        } catch (error) {
            this.logger.error('Oracle failed to analyze compatibility', error);
            return {
                score: 50,
                analysis: 'Làn sương mù che phủ tầm nhìn của Oracle. Hãy thử lại sau...',
                common_ground: [],
                combo_breakers: [],
                oracle_verdict: 'Số phận chưa rõ ràng',
            };
        }
    }

    /**
     * 🎭 THE BARD: Generate 3 contextual icebreaker options
     * Returns Casual/Funny, Deep/Thoughtful, Direct/Bold options
     * RPG tavern style - like dialogue choices in Skyrim/Fallout
     */
    async generateIcebreakerOptions(
        targetProfile: { bio?: string; tags?: string[]; occupation?: string; display_name?: string; interests?: string[] },
    ): Promise<IcebreakerOptions> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const profileInfo = [
                targetProfile.display_name ? `Name: ${targetProfile.display_name}` : '',
                targetProfile.bio ? `Bio: "${targetProfile.bio}"` : '',
                targetProfile.occupation ? `Job: ${targetProfile.occupation}` : '',
                targetProfile.tags?.length ? `Interests: ${targetProfile.tags.join(', ')}` : '',
                targetProfile.interests?.length ? `Hobbies: ${targetProfile.interests.join(', ')}` : '',
            ].filter(Boolean).join('\n');

            const prompt = `You are THE BARD - a charming storyteller in a retro RPG tavern called "Peerzee Inn".

A brave adventurer wants to approach this fellow traveler:
${profileInfo || 'A mysterious stranger with unknown background'}

Generate 3 opening lines as dialogue choices (like in Skyrim/Fallout/Mass Effect):

🎮 Option 1 - CASUAL/FUNNY (8-bit humor, light-hearted, gaming references welcome)
🎮 Option 2 - DEEP/THOUGHTFUL (Lore-related, philosophical, shows genuine interest)
🎮 Option 3 - DIRECT/BOLD (PVP challenge style, confident, slightly flirty)

Rules:
- Each line MUST be under 20 words
- Write in Vietnamese
- Reference their specific interests/bio when possible
- Make each option distinctly different in tone
- Sound natural, not robotic

Return ONLY this JSON (no markdown):
{
  "options": [
    "<casual/funny option>",
    "<deep/thoughtful option>",
    "<direct/bold option>"
  ],
  "target_highlight": "<What aspect of their profile inspired these? 1 sentence Vietnamese>"
}`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const response = JSON.parse(responseText);

            this.logger.log(`Bard generated ${response.options?.length || 0} icebreaker options`);

            return {
                options: Array.isArray(response.options) ? response.options.slice(0, 3) : [
                    'Yo! Mình thấy bạn có vẻ thú vị, làm quen nhé?',
                    'Profile của bạn khiến mình tò mò, kể thêm về bản thân được không?',
                    'Hmm, có vẻ như ta là đối thủ xứng tầm. Thử xem ai hay hơn?',
                ],
                target_highlight: response.target_highlight || 'Dựa trên profile của người ấy',
            };
        } catch (error) {
            this.logger.error('Bard failed to generate icebreakers', error);
            return {
                options: [
                    'Hey! Mình thấy bạn có gu rất đặc biệt, làm quen nhé? 🎮',
                    'Bio của bạn khiến mình suy nghĩ... Kể thêm về bản thân được không?',
                    'Có vẻ như chúng ta sẽ có cuộc trò chuyện thú vị đây!',
                ],
                target_highlight: 'Bard đang nghỉ ngơi, đây là gợi ý mặc định',
            };
        }
    }

    /**
     * 📜 THE SCRIBE: Rewrite boring bio into RPG Character Description
     * Transforms plain text into epic character sheets with Class, Stats, Inventory, Quest
     */
    async rewriteBioRPG(rawBio: string): Promise<ScribeResult> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `You are THE SCRIBE - the legendary writer of Peerzee Kingdom who transforms mundane life stories into EPIC character descriptions.

Original bio: "${rawBio}"

Your quest: Rewrite this bio as an RPG Character Sheet description!

Rules:
- Use terms like: Class, Level, Stats, Skills, Inventory, Quest, Abilities, Passive Skills
- Keep it CUTE, fun, and readable (not cringe)
- Write in Vietnamese
- Maximum 50 words
- Make them sound like a lovable game character
- Include at least one emoji that fits their "class"

Examples:
- "Mình là dev" → "⚔️ Lvl 25 Code Warrior | Passive: Debug mọi lúc mọi nơi | Quest: Tìm người yêu không bug"
- "Thích mèo và đọc sách" → "📚 Lvl 18 Cat Mage | Inventory: 3 mèo + 100 cuốn sách | Skill: Nhớ plot twist cực đỉnh"

Return ONLY this JSON (no markdown):
{
  "rpg_bio": "<the rewritten bio in RPG style>",
  "character_class": "<their detected class in English, e.g. 'Code Wizard', 'Cat Mage', 'Gym Warrior'>",
  "power_level": <estimated level 1-99 based on how interesting the bio is>
}`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const response = JSON.parse(responseText);

            this.logger.log(`Scribe rewrote bio as ${response.character_class}`);

            return {
                rpg_bio: response.rpg_bio || `⚔️ Mysterious Adventurer | Bio đang được viết lại...`,
                character_class: response.character_class || 'Unknown Class',
                power_level: Math.min(99, Math.max(1, response.power_level || 20)),
            };
        } catch (error) {
            this.logger.error('Scribe failed to rewrite bio', error);
            return {
                rpg_bio: '🎮 Mysterious Adventurer | Skills: Đang cập nhật... | Quest: Tìm kiếm tri kỷ',
                character_class: 'Mysterious Adventurer',
                power_level: 20,
            };
        }
    }
}

// Spotify Audio Features interface (matching SpotifyService)
export interface SpotifyAudioFeatures {
    danceability: number;
    energy: number;
    valence: number;
    tempo: number;
    acousticness: number;
    instrumentalness: number;
    liveness: number;
    speechiness: number;
    loudness: number;
    mode: number;
    key: number;
    timeSignature: number;
}

// Music Vibe Result interface
export interface MusicVibeResult {
    mood: string;
    color: string;
    keywords: string[];
    quote: string;
    description: string;
    match_vibe: string;
}

// Audio Vibe Result interface (for Gemini multimodal audio analysis)
export interface AudioVibeResult {
    mood: string;
    color: string;
    keywords: string[];
    description: string;
}

// Search Filters interface
export interface SearchFilters {
    gender: 'MALE' | 'FEMALE' | null;
    city: string | null;
    intent: 'FRIEND' | 'DATE' | 'STUDY' | null;
    semantic_text: string;
}

// 🔮 Oracle Compatibility Result interface
export interface CompatibilityResult {
    score: number;
    analysis: string;
    common_ground: string[];
    combo_breakers: string[];
    oracle_verdict: string;
}

// 🎭 Bard Icebreaker Options interface
export interface IcebreakerOptions {
    options: string[];
    target_highlight: string;
}

// 📜 Scribe Bio Rewrite Result interface
export interface ScribeResult {
    rpg_bio: string;
    character_class: string;
    power_level: number;
}
