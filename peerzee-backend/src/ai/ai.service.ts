import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private readonly genAI: GoogleGenerativeAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY not configured - AI features will be disabled');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
    }

    /**
     * Generate embedding vector for text using Gemini text-embedding-004
     * @param text Text to generate embedding for
     * @returns 768-dimensional vector
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
            const result = await model.embedContent(text);

            const embedding = result.embedding.values;

            // Validate embedding dimensions (Gemini text-embedding-004 = 768 dims)
            if (embedding.length !== 768) {
                this.logger.warn(`Unexpected embedding dimension: ${embedding.length}, expected 768`);
            }

            return embedding;
        } catch (error) {
            this.logger.error('Failed to generate embedding', error);
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

            const prompt = `Analyze this search query: "${userQuery}"

Extract JSON with these fields:
- gender: "MALE" | "FEMALE" | null (based on keywords like "nam", "nữ", "male", "female", "boy", "girl")
- city: string | null (Vietnamese city names like "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", etc.)
- intent: "FRIEND" | "DATE" | "STUDY" | null (based on keywords like "bạn học"="STUDY", "hẹn hò"/"tình yêu"="DATE", "kết bạn"="FRIEND")
- semantic_text: string (keywords for semantic search, translate Vietnamese to English if needed, focus on interests/personality/profession)

Examples:
- "Tìm bạn nữ học AI ở Hà Nội" -> {"gender":"FEMALE","city":"Hà Nội","intent":"STUDY","semantic_text":"AI machine learning study partner"}
- "Nam thích gym Sài Gòn" -> {"gender":"MALE","city":"Hồ Chí Minh","intent":null,"semantic_text":"gym fitness workout"}
- "Người thích code và coffee" -> {"gender":null,"city":null,"intent":null,"semantic_text":"coding programming coffee developer"}

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
}

// Search Filters interface
export interface SearchFilters {
    gender: 'MALE' | 'FEMALE' | null;
    city: string | null;
    intent: 'FRIEND' | 'DATE' | 'STUDY' | null;
    semantic_text: string;
}
