'use client';

import { useState, useCallback } from 'react';
import { aiApi, ScribeResult } from '@/lib/api';

interface UseScribeReturn {
    loading: boolean;
    error: string | null;
    result: ScribeResult | null;
    rewriteBio: (rawBio: string) => Promise<ScribeResult | null>;
    reset: () => void;
}

/**
 * 📜 THE SCRIBE Hook
 * Rewrites boring bio into RPG Character Sheet description
 * Add a "✨ Magic Rewrite" button next to Bio input in ProfileEdit
 */
export function useScribe(): UseScribeReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ScribeResult | null>(null);

    const rewriteBio = useCallback(async (rawBio: string): Promise<ScribeResult | null> => {
        if (!rawBio || rawBio.trim().length < 3) {
            setError('Bio quá ngắn để viết lại');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await aiApi.rewriteBio(rawBio);
            setResult(response.data);
            return response.data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Scribe đang nghỉ ngơi...';
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

    return { loading, error, result, rewriteBio, reset };
}

export default useScribe;
