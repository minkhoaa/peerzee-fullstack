/**
 * 🎮 RAG Matchmaker Agent - State Definition
 * Shared memory for the LangGraph workflow
 */

export interface MatchFilters {
    gender: 'MALE' | 'FEMALE' | null;
    location: string | null;
    semantic_topic: string;
}

export interface CandidateProfile {
    id: string;
    display_name: string;
    bio?: string;
    location?: string;
    age?: number;
    occupation?: string;
    tags?: string[];
    intentMode?: string;
    matchScore?: number;
}

export interface FinalMatch {
    profile: CandidateProfile;
    reasoning: string; // The "Sales Pitch" from RAG
}

export interface MatchState {
    // Input
    userQuery: string; // e.g., "Tìm bạn nam ở HN thích code"
    userId: string;    // Current user ID for filtering

    // Extracted Constraints (from Node A)
    filters: MatchFilters;

    // Raw profiles from Vector DB (from Node B)
    candidates: CandidateProfile[];

    // The RAG Output (from Node C)
    finalMatch: FinalMatch | null;

    // Progress tracking for UI
    steps: string[];
    currentStep: string;
    error?: string;
}

// Initial state factory
export function createInitialMatchState(userQuery: string, userId: string): MatchState {
    return {
        userQuery,
        userId,
        filters: {
            gender: null,
            location: null,
            semantic_topic: '',
        },
        candidates: [],
        finalMatch: null,
        steps: [],
        currentStep: 'INITIALIZING',
    };
}
