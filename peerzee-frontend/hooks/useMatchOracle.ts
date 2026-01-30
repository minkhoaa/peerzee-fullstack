'use client';

import { useState, useCallback } from 'react';
import { aiApi, CompatibilityResult, ProfileForAI } from '@/lib/api';

interface UseMatchOracleReturn {
    loading: boolean;
    error: string | null;
    result: CompatibilityResult | null;
    analyzeMatch: (userProfile: ProfileForAI, targetProfile: ProfileForAI) => Promise<CompatibilityResult | null>;
    reset: () => void;
}

/**
 * 🔮 THE ORACLE Hook
 * Fetches AI-powered compatibility analysis between two profiles
 * Returns Synergy Score, Critical Hits (common ground), and Combo Breakers (conflicts)
 */
export function useMatchOracle(): UseMatchOracleReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CompatibilityResult | null>(null);

    const analyzeMatch = useCallback(async (
        userProfile: ProfileForAI,
        targetProfile: ProfileForAI
    ): Promise<CompatibilityResult | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await aiApi.analyzeCompatibility(userProfile, targetProfile);
            setResult(response.data);
            return response.data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Oracle đang nghỉ ngơi...';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
        setLoading(false);
    }, []);

    return { loading, error, result, analyzeMatch, reset };
}

export default useMatchOracle;
