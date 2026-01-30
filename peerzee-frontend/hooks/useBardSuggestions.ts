'use client';

import { useState, useCallback } from 'react';
import { aiApi, IcebreakerOptions, ProfileForAI } from '@/lib/api';

interface UseBardSuggestionsReturn {
    loading: boolean;
    error: string | null;
    suggestions: IcebreakerOptions | null;
    generateSuggestions: (targetProfile: ProfileForAI) => Promise<IcebreakerOptions | null>;
    reset: () => void;
}

/**
 * 🎭 THE BARD Hook
 * Generates 3 icebreaker dialogue options when chat window opens
 * Options: Casual/Funny, Deep/Thoughtful, Direct/Bold
 * Display as clickable "Dialogue Choices" like in Skyrim/Fallout
 */
export function useBardSuggestions(): UseBardSuggestionsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<IcebreakerOptions | null>(null);

    const generateSuggestions = useCallback(async (
        targetProfile: ProfileForAI
    ): Promise<IcebreakerOptions | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await aiApi.generateIcebreaker(targetProfile);
            setSuggestions(response.data);
            return response.data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Bard đang nghỉ ngơi...';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setSuggestions(null);
        setError(null);
        setLoading(false);
    }, []);

    return { loading, error, suggestions, generateSuggestions, reset };
}

export default useBardSuggestions;
