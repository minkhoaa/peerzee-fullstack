'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProfileTip {
    category: string;
    tip: string;
    priority: 'high' | 'medium' | 'low';
}

interface IcebreakerResult {
    icebreakers: string[];
    contextHints: string[];
}

interface SuggestReplyResult {
    suggestions: string[];
    analysis: string;
}

/**
 * useWingman - Hook for AI Wingman interactions
 */
export function useWingman() {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const chat = useCallback(async (
        message: string,
        options?: { targetUserId?: string; chatContext?: string }
    ): Promise<{ reply: string; suggestions?: string[] } | null> => {
        if (!token) return null;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    targetUserId: options?.targetUserId,
                    chatContext: options?.chatContext
                })
            });
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (error) {
            console.error('Wingman chat failed:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const getProfileTips = useCallback(async (): Promise<{
        tips: ProfileTip[];
        overallScore: number;
    } | null> => {
        if (!token) return null;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/profile-tips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to get profile tips:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const getIcebreakers = useCallback(async (
        targetUserId: string
    ): Promise<IcebreakerResult | null> => {
        if (!token) return null;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/icebreakers/${targetUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to get icebreakers:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const suggestReply = useCallback(async (
        messages: { sender: 'me' | 'them'; content: string }[],
        targetUserId?: string
    ): Promise<SuggestReplyResult | null> => {
        if (!token) return null;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/suggest-reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ messages, targetUserId })
            });
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to suggest reply:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const clearHistory = useCallback(async (): Promise<boolean> => {
        if (!token) return false;
        try {
            const res = await fetch(`${API_BASE}/wingman/history`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.ok;
        } catch (error) {
            console.error('Failed to clear history:', error);
            return false;
        }
    }, [token]);

    return {
        chat,
        getProfileTips,
        getIcebreakers,
        suggestReply,
        clearHistory,
        isLoading
    };
}
