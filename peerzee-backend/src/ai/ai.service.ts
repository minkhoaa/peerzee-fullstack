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
     * Generate a fun icebreaker message for two matched users
     * @param userA_Bio Bio of user A
     * @param userB_Bio Bio of user B
     * @returns Icebreaker message in Vietnamese
     */
    async generateIcebreaker(userA_Bio: string, userB_Bio: string): Promise<string> {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `Generate a short, fun icebreaker (1 sentence) for two people with these bios:

Person A: ${userA_Bio || 'No bio provided'}
Person B: ${userB_Bio || 'No bio provided'}

Requirements:
- Keep it casual and friendly
- Make it relevant to their shared interests if any
- Language: Vietnamese
- Just output the icebreaker, no explanation`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const icebreaker = response.text().trim();

            return icebreaker;
        } catch (error) {
            this.logger.error('Failed to generate icebreaker', error);
            // Return a default icebreaker if AI fails
            return 'Chào bạn! Rất vui được kết nối với bạn! 👋';
        }
    }

    /**
     * Generate profile embedding from profile data
     * Serializes profile fields into structured text for embedding
     */
    async generateProfileEmbedding(profile: {
        intentMode?: string;
        occupation?: string;
        bio?: string;
        tags?: string[];
        education?: string;
        location?: string;
        prompts?: { question: string; answer: string }[];
    }): Promise<number[]> {
        const parts: string[] = [];

        if (profile.intentMode) parts.push(`Intent: ${profile.intentMode}`);
        if (profile.occupation) parts.push(`Job: ${profile.occupation}`);
        if (profile.bio) parts.push(`Bio: ${profile.bio}`);
        if (profile.tags?.length) parts.push(`Tags: ${profile.tags.join(', ')}`);
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
}

// Search Filters interface
export interface SearchFilters {
    gender: 'MALE' | 'FEMALE' | null;
    city: string | null;
    intent: 'FRIEND' | 'DATE' | 'STUDY' | null;
    semantic_text: string;
}
