/**
 * Quest System Types
 * Daily Quests feature for gamification
 */

// ============================================
// QUEST STATUS ENUM
// ============================================
export type QuestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';

// ============================================
// QUEST DIFFICULTY (Optional extension)
// ============================================
export type QuestDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

// ============================================
// QUEST REWARD TYPE
// ============================================
export interface QuestReward {
  xp: number;
  coins?: number;
  badge?: string;
}

// ============================================
// CORE QUEST MODEL
// ============================================
export interface Quest {
  id: string;
  title: string;           // e.g., "Say Hello to 3 Strangers"
  description: string;     // Detailed description
  currentProgress: number; // e.g., 1
  targetProgress: number;  // e.g., 3
  rewardXP: number;        // e.g., 100 XP
  status: QuestStatus;
  icon?: string;           // Icon name (lucide) or emoji
  difficulty?: QuestDifficulty;
  expiresAt?: string;      // ISO date - when quest resets
  category?: string;       // e.g., "SOCIAL", "DISCOVERY", "ENGAGEMENT"
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface QuestApiResponse {
  data: Quest[];
  totalXP: number;         // Total XP earned today
  dailyStreak: number;     // How many days in a row completed
  nextResetAt: string;     // ISO date - when quests reset
}

export interface ClaimQuestResponse {
  success: boolean;
  quest: Quest;
  xpEarned: number;
  newTotalXP: number;
  message?: string;
}

// ============================================
// REQUEST TYPES
// ============================================
export interface ClaimQuestRequest {
  questId: string;
}

// ============================================
// HOOK STATE TYPES
// ============================================
export interface QuestState {
  quests: Quest[];
  totalXP: number;
  dailyStreak: number;
  isLoading: boolean;
  error: string | null;
  isClaiming: string | null; // questId being claimed
}

export interface UseQuestDataReturn extends QuestState {
  claimQuest: (questId: string) => Promise<void>;
  refetch: () => Promise<void>;
}
