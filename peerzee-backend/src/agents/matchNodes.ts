import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MatchState, MatchFilters, CandidateProfile, FinalMatch } from './matchState';
import { DiscoverService } from '../discover/discover.service';

/**
 * RAG Matchmaker Agent - Node Implementations
 * 3 Nodes: parseIntent -> retrieveCandidates -> curateMatch
 */
@Injectable()
export class MatchNodes {
    private readonly logger = new Logger(MatchNodes.name);
    private readonly genAI: GoogleGenerativeAI;

    constructor(private readonly discoverService: DiscoverService) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    }

    /**
     * NODE A: Parse Intent
     * Extract structured filters from natural language query
     */
    async parseIntentNode(state: MatchState): Promise<Partial<MatchState>> {
        this.logger.log(`[PARSE] Processing: "${state.userQuery}"`);

        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze this search query for a social/dating app: "${state.userQuery}"

Extract structured data into JSON:
- gender: "MALE" | "FEMALE" | null. 
  CRITICAL: ONLY extract if the user EXPLICITLY requests a gender (e.g., "tìm bạn nữ", "kiếm anh nào", "looking for a girl"). 
  If they just describe interests (e.g., "thích code", "tìm người học cùng"), return null.
- location: string | null.
  CRITICAL: ONLY extract if a city/location is EXPLICITLY mentioned (e.g., "ở Hà Nội", "Sài Gòn", "in Đà Nẵng"). 
  If no location is mentioned, return null. DO NOT guess based on the language.
- semantic_topic: string. 
  The core interests, hobbies, or purpose of the search in Vietnamese.

Examples:
- "Tìm bạn nữ ở Hà Nội thích cafe" → {"gender": "FEMALE", "location": "Hà Nội", "semantic_topic": "thích cafe, chill"}
- "Người yêu code và game" → {"gender": null, "location": null, "semantic_topic": "code, game, công nghệ"}
- "Bạn nam Sài Gòn học AI" → {"gender": "MALE", "location": "Sài Gòn", "semantic_topic": "AI, học tập"}

Return ONLY the JSON. No markdown, no explanation.`;

        try {
            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const parsed = JSON.parse(responseText);

            const filters: MatchFilters = {
                gender: parsed.gender || null,
                location: parsed.location || null,
                semantic_topic: parsed.semantic_topic || state.userQuery,
            };

            this.logger.log(`[PARSE] Extracted: ${JSON.stringify(filters)}`);

            return {
                filters,
                steps: [...state.steps, 'Parsing intent...'],
                currentStep: 'PARSED',
            };
        } catch (error) {
            this.logger.error('[PARSE] Failed to parse intent', error);
            return {
                filters: {
                    gender: null,
                    location: null,
                    semantic_topic: state.userQuery,
                },
                steps: [...state.steps, 'Parse fallback...'],
                currentStep: 'PARSED',
            };
        }
    }

    /**
     * NODE B: Retrieve Candidates
     * Call semantic search to get Top 5 profiles
     */
    async retrieveCandidatesNode(state: MatchState): Promise<Partial<MatchState>> {
        this.logger.log(`[RETRIEVE] Searching: "${state.filters.semantic_topic}"`);

        try {
            const searchResult = await this.discoverService.searchUsers(
                state.filters.semantic_topic,
                state.userId,
                5, // Top 5 candidates
            );

            const candidates: CandidateProfile[] = searchResult.results.map((r) => ({
                id: r.id,
                display_name: r.display_name,
                bio: r.bio,
                location: r.location,
                age: r.age,
                occupation: r.occupation,
                tags: r.tags,
                intentMode: r.intentMode,
                matchScore: r.matchScore,
            }));

            this.logger.log(`[RETRIEVE] Found ${candidates.length} candidates`);

            return {
                candidates,
                steps: [...state.steps, `Scanning database... (${candidates.length} found)`],
                currentStep: 'RETRIEVED',
            };
        } catch (error) {
            this.logger.error('[RETRIEVE] Search failed', error);
            return {
                candidates: [],
                steps: [...state.steps, 'Search failed'],
                currentStep: 'RETRIEVED',
                error: 'Database search failed',
            };
        }
    }

    /**
     * NODE C: Curate Match (The RAG Step) - CRITICAL
     * Pick the BEST single match and explain why
     */
    async curateMatchNode(state: MatchState): Promise<Partial<MatchState>> {
        this.logger.log(`[RAG] Analyzing ${state.candidates.length} candidates`);

        if (state.candidates.length === 0) {
            return {
                finalMatch: null,
                steps: [...state.steps, 'No candidates found'],
                currentStep: 'COMPLETE',
            };
        }

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Format candidates for the prompt
        const candidatesJson = JSON.stringify(
            state.candidates.map((c, i) => ({
                index: i + 1,
                id: c.id,
                name: c.display_name,
                bio: c.bio || 'Chưa có bio',
                tags: c.tags?.join(', ') || 'Không có tags',
                occupation: c.occupation || 'Không rõ',
                location: c.location || 'Không rõ',
                score: c.matchScore,
            })),
            null,
            2
        );

        const prompt = `You are a professional Matchmaker.
The User asked: "${state.userQuery}"

Here are the Top ${state.candidates.length} Candidates found:
${candidatesJson}

YOUR TASK:
1. Select the #1 most compatible candidate based on the user's request.
2. Write a "Match Rationale" (max 2 sentences in Vietnamese).
   - Explain WHY they fit the user's request.
   - Mention SPECIFIC details from their bio/tags.
   - Be helpful, polite, and specific.

Return ONLY this JSON (no markdown):
{
  "selected_index": <1-5>,
  "reasoning": "<Vietnamese rationale, professional and specific>"
}

Example reasoning:
"Tôi chọn bạn này vì có sở thích về công nghệ và lập trình, rất phù hợp với yêu cầu của bạn. Ngoài ra, bạn ấy cũng đang sống tại Hà Nội."`;

        try {
            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }

            const ragResult = JSON.parse(responseText);
            const selectedIndex = Math.max(0, Math.min(state.candidates.length - 1, (ragResult.selected_index || 1) - 1));
            const selectedProfile = state.candidates[selectedIndex];

            const finalMatch: FinalMatch = {
                profile: selectedProfile,
                reasoning: ragResult.reasoning || 'Đây là lựa chọn tốt nhất dựa trên profile!',
            };

            this.logger.log(`[RAG] Selected: ${selectedProfile.display_name}`);

            return {
                finalMatch,
                steps: [...state.steps, 'Analyzing profiles...', 'Match found!'],
                currentStep: 'COMPLETE',
            };
        } catch (error) {
            this.logger.error('[RAG] Curation failed', error);

            // Fallback: pick the first candidate
            const fallback: FinalMatch = {
                profile: state.candidates[0],
                reasoning: '🎲 Oracle chọn ngẫu nhiên vì hệ thống đang bận. Hãy thử lại!',
            };

            return {
                finalMatch: fallback,
                steps: [...state.steps, '⚠️ RAG FALLBACK...'],
                currentStep: 'COMPLETE',
            };
        }
    }
}
