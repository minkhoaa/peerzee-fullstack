/**
 * Quest API Service
 * ==================
 * This file contains API calls for the Quest system.
 * 
 * IMPORTANT: Currently using MOCK data with simulated delays.
 * 
 * TO SWAP FOR REAL API:
 * 1. Replace the mock functions with actual axios/fetch calls
 * 2. Update the BASE_URL to your backend
 * 3. Remove the delay() helper
 * 
 * Example real implementation:
 * ```
 * import axios from 'axios';
 * const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
 * 
 * export const questApi = {
 *   getDailyQuests: () => api.get<QuestApiResponse>('/api/quests/daily'),
 *   claimQuest: (id: string) => api.post<ClaimQuestResponse>(`/api/quests/${id}/claim`),
 * };
 * ```
 */

import type { 
  Quest, 
  QuestApiResponse, 
  ClaimQuestResponse 
} from '@/types/quest';

// ============================================
// MOCK CONFIG
// ============================================
const MOCK_DELAY_MS = 500; // Simulate network latency

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// MOCK DATA
// ============================================
const MOCK_QUESTS: Quest[] = [
  {
    id: 'quest-1',
    title: 'Say Hello to 3 Strangers',
    description: 'Start conversations with new people in the community',
    currentProgress: 1,
    targetProgress: 3,
    rewardXP: 100,
    status: 'IN_PROGRESS',
    icon: '👋',
    difficulty: 'EASY',
    category: 'SOCIAL',
  },
  {
    id: 'quest-2',
    title: 'Complete Your Profile',
    description: 'Add a bio, photos, and interests to your profile',
    currentProgress: 4,
    targetProgress: 4,
    rewardXP: 150,
    status: 'COMPLETED',
    icon: '✏️',
    difficulty: 'EASY',
    category: 'PROFILE',
  },
  {
    id: 'quest-3',
    title: 'Like 5 Posts',
    description: 'Show appreciation for content you enjoy',
    currentProgress: 5,
    targetProgress: 5,
    rewardXP: 75,
    status: 'CLAIMED',
    icon: '❤️',
    difficulty: 'EASY',
    category: 'ENGAGEMENT',
  },
  {
    id: 'quest-4',
    title: 'Join a Video Chat',
    description: 'Meet someone face-to-face in video dating',
    currentProgress: 0,
    targetProgress: 1,
    rewardXP: 200,
    status: 'IN_PROGRESS',
    icon: '📹',
    difficulty: 'MEDIUM',
    category: 'DISCOVERY',
  },
  {
    id: 'quest-5',
    title: 'Create Your First Post',
    description: 'Share something with the community',
    currentProgress: 0,
    targetProgress: 1,
    rewardXP: 125,
    status: 'IN_PROGRESS',
    icon: '📝',
    difficulty: 'EASY',
    category: 'ENGAGEMENT',
  },
];

// ============================================
// API SERVICE (MOCK IMPLEMENTATION)
// ============================================

/**
 * Get daily quests for the current user
 * 
 * Real API: GET /api/quests/daily
 */
export async function getDailyQuests(): Promise<QuestApiResponse> {
  // Simulate network delay
  await delay(MOCK_DELAY_MS);
  
  // Simulate occasional network error (10% chance) - uncomment to test
  // if (Math.random() < 0.1) {
  //   throw new Error('Network error: Failed to fetch quests');
  // }
  
  const claimedXP = MOCK_QUESTS
    .filter(q => q.status === 'CLAIMED')
    .reduce((sum, q) => sum + q.rewardXP, 0);
  
  return {
    data: [...MOCK_QUESTS], // Return copy to avoid mutation
    totalXP: claimedXP,
    dailyStreak: 5,
    nextResetAt: getNextMidnight().toISOString(),
  };
}

/**
 * Claim reward for a completed quest
 * 
 * Real API: POST /api/quests/{id}/claim
 */
export async function claimQuest(questId: string): Promise<ClaimQuestResponse> {
  // Simulate network delay
  await delay(MOCK_DELAY_MS);
  
  const quest = MOCK_QUESTS.find(q => q.id === questId);
  
  if (!quest) {
    throw new Error(`Quest not found: ${questId}`);
  }
  
  if (quest.status !== 'COMPLETED') {
    throw new Error('Quest is not ready to be claimed');
  }
  
  // Update mock data (in real app, backend handles this)
  quest.status = 'CLAIMED';
  
  const newTotalXP = MOCK_QUESTS
    .filter(q => q.status === 'CLAIMED')
    .reduce((sum, q) => sum + q.rewardXP, 0);
  
  return {
    success: true,
    quest: { ...quest },
    xpEarned: quest.rewardXP,
    newTotalXP,
    message: `+${quest.rewardXP} XP earned!`,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNextMidnight(): Date {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

// ============================================
// EXPORT API OBJECT (for easy swapping)
// ============================================
export const questApi = {
  getDailyQuests,
  claimQuest,
};

export default questApi;
