'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

export interface GamificationStatus {
    xp: number;
    level: number;
    badges: string[];
    currentStreak: number;
    xpProgress: number;
    xpNeeded: number;
    progressPercent: number;
}

export interface Quest {
    questId: string;
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    progress: number;
    rewardXp: number;
    rewardCoins: number;
    icon: string;
    isDaily: boolean;
    isWeekly: boolean;
    status: 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED';
    expiresAt?: string;
}

export interface QuestsData {
    quests: Quest[];
    totalXpToday: number;
    questsCompleted: number;
    dailyStreak: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    isCurrentUser: boolean;
}

export interface LeaderboardData {
    leaders: LeaderboardEntry[];
    myRank: number;
}

export function useGamification() {
    const { token } = useAuth();

    return useQuery<GamificationStatus>({
        queryKey: ['gamification', 'status'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/gamification/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch gamification status');
            return res.json();
        },
        enabled: !!token,
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useQuests() {
    const { token } = useAuth();

    return useQuery<QuestsData>({
        queryKey: ['gamification', 'quests'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/gamification/quests`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch quests');
            return res.json();
        },
        enabled: !!token,
        staleTime: 30 * 1000,
    });
}

export function useClaimQuest() {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (questId: string) => {
            const res = await fetch(`${API_BASE}/gamification/quests/${questId}/claim`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to claim quest');
            return res.json();
        },
        onSuccess: () => {
            // Invalidate both gamification status and quests
            queryClient.invalidateQueries({ queryKey: ['gamification'] });
        },
    });
}

export function useLeaderboard() {
    const { token } = useAuth();

    return useQuery<LeaderboardData>({
        queryKey: ['gamification', 'leaderboard'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/gamification/leaderboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return res.json();
        },
        enabled: !!token,
        staleTime: 60 * 1000, // 1 minute
    });
}
