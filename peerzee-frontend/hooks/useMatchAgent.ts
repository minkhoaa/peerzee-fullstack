'use client';

import { useState, useCallback } from 'react';
import { agentApi, AgentMatchResult } from '@/lib/api';

interface UseMatchAgentReturn {
    loading: boolean;
    error: string | null;
    result: AgentMatchResult | null;
    steps: string[];
    runAgent: (query: string) => Promise<AgentMatchResult | null>;
    reset: () => void;
}

/**
 * RAG Matchmaker Agent Hook
 * Runs the 3-node agent: Parse → Retrieve → RAG Curate
 * Returns the best match with AI-generated reasoning
 */
export function useMatchAgent(): UseMatchAgentReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AgentMatchResult | null>(null);
    const [steps, setSteps] = useState<string[]>([]);

    const runAgent = useCallback(async (query: string): Promise<AgentMatchResult | null> => {
        if (!query.trim()) {
            setError('Query cannot be empty');
            return null;
        }

        setLoading(true);
        setError(null);
        setSteps(['[SYSTEM] Initializing agent...']);

        try {
            // Simulate step progression for UI
            setSteps(prev => [...prev, '[PARSER] Analyzing query...']);

            const response = await agentApi.match(query);
            const data = response.data;

            setResult(data);
            setSteps(data.steps || []);

            if (data.error) {
                setError(data.error);
            }

            return data;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Agent failed';
            setError(message);
            setSteps(prev => [...prev, '[ERROR] Agent execution failed']);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
        setSteps([]);
        setLoading(false);
    }, []);

    return { loading, error, result, steps, runAgent, reset };
}

export default useMatchAgent;
