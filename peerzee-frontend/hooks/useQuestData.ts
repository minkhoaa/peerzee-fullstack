/**
 * useQuestData Hook
 * =================
 * Custom hook for managing Quest system state and API interactions.
 * 
 * Features:
 * - Fetch daily quests on mount
 * - Claim quest rewards with optimistic updates
 * - Loading and error states
 * - Refetch capability
 * 
 * Usage:
 * ```tsx
 * const { quests, totalXP, isLoading, error, claimQuest } = useQuestData();
 * ```
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Quest, UseQuestDataReturn } from '@/types/quest';
import { questApi } from '@/services/questApi';

export function useQuestData(): UseQuestDataReturn {
  // ============================================
  // STATE
  // ============================================
  const [quests, setQuests] = useState<Quest[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  // ============================================
  // FETCH QUESTS
  // ============================================
  const fetchQuests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await questApi.getDailyQuests();
      
      setQuests(response.data);
      setTotalXP(response.totalXP);
      setDailyStreak(response.dailyStreak);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load quests';
      setError(message);
      console.error('Error fetching quests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // CLAIM QUEST (with Optimistic Update)
  // ============================================
  const claimQuest = useCallback(async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    
    if (!quest || quest.status !== 'COMPLETED') {
      console.warn('Cannot claim quest:', questId);
      return;
    }

    // Store previous state for rollback
    const previousQuests = [...quests];
    const previousXP = totalXP;

    try {
      setIsClaiming(questId);

      // OPTIMISTIC UPDATE: Update UI immediately
      setQuests(prev => prev.map(q => 
        q.id === questId 
          ? { ...q, status: 'CLAIMED' as const }
          : q
      ));
      setTotalXP(prev => prev + quest.rewardXP);

      // Make actual API call
      const response = await questApi.claimQuest(questId);

      // Update with server response (in case of any differences)
      setQuests(prev => prev.map(q => 
        q.id === questId ? response.quest : q
      ));
      setTotalXP(response.newTotalXP);

    } catch (err) {
      // ROLLBACK on error
      setQuests(previousQuests);
      setTotalXP(previousXP);
      
      const message = err instanceof Error ? err.message : 'Failed to claim reward';
      setError(message);
      console.error('Error claiming quest:', err);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsClaiming(null);
    }
  }, [quests, totalXP]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  // ============================================
  // RETURN
  // ============================================
  return {
    quests,
    totalXP,
    dailyStreak,
    isLoading,
    error,
    isClaiming,
    claimQuest,
    refetch: fetchQuests,
  };
}

export default useQuestData;
