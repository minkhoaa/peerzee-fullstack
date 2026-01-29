'use client';

import React from 'react';
import { 
  Swords, 
  Trophy, 
  Flame, 
  RefreshCw, 
  AlertTriangle,
  Loader2,
  Check,
  Zap
} from 'lucide-react';
import { useQuestData } from '@/hooks/useQuestData';
import type { Quest, QuestStatus } from '@/types/quest';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa - Primary text
  textMuted: '#5D4037',      // Medium Brown - Secondary text
  background: '#FFFFFF',      // Pure White - Card background
  border: '#5A3E36',          // Dark Cocoa - Borders
  progressFill: '#98D689',    // Pixel Green - Progress bar
  buttonPink: '#F4B0C8',      // Retro Pink - Claim button
  buttonGreen: '#98D689',     // Pixel Green - Claimed state
  errorBg: '#FFEBEE',         // Light Red - Error background
  errorText: '#C62828',       // Red - Error text
} as const;

// ============================================
// QUEST BOARD COMPONENT
// ============================================
export default function QuestBoard() {
  const { 
    quests, 
    totalXP, 
    dailyStreak, 
    isLoading, 
    error, 
    isClaiming,
    claimQuest, 
    refetch 
  } = useQuestData();

  return (
    <div 
      className="border-[4px] rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: COLORS.background, 
        borderColor: COLORS.border 
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b-[3px] flex items-center justify-between"
        style={{ 
          backgroundColor: '#FFF9F5', 
          borderColor: COLORS.border 
        }}
      >
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5" style={{ color: COLORS.border }} />
          <h2 
            className="font-pixel text-lg uppercase tracking-wide"
            style={{ color: COLORS.text }}
          >
            DAILY QUESTS
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {/* XP Counter */}
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" style={{ color: '#F59E0B' }} />
            <span 
              className="font-pixel text-sm"
              style={{ color: COLORS.text }}
            >
              {totalXP} XP
            </span>
          </div>
          
          {/* Streak Counter */}
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4" style={{ color: '#EF4444' }} />
            <span 
              className="font-pixel text-sm"
              style={{ color: COLORS.text }}
            >
              {dailyStreak} DAY
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Loading State */}
        {isLoading && <QuestBoardSkeleton />}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState error={error} onRetry={refetch} />
        )}

        {/* Quest List */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {quests.length === 0 ? (
              <EmptyState />
            ) : (
              quests.map((quest) => (
                <QuestItem
                  key={quest.id}
                  quest={quest}
                  isClaiming={isClaiming === quest.id}
                  onClaim={() => claimQuest(quest.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && quests.length > 0 && (
        <div 
          className="px-4 py-2 border-t-[2px] border-dashed text-center"
          style={{ borderColor: `${COLORS.border}40` }}
        >
          <p 
            className="text-xs font-bold"
            style={{ color: COLORS.textMuted }}
          >
            Quests reset daily at midnight ✨
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// QUEST ITEM COMPONENT
// ============================================
interface QuestItemProps {
  quest: Quest;
  isClaiming: boolean;
  onClaim: () => void;
}

function QuestItem({ quest, isClaiming, onClaim }: QuestItemProps) {
  const progressPercent = Math.min(
    (quest.currentProgress / quest.targetProgress) * 100, 
    100
  );

  return (
    <div 
      className="flex items-center gap-3 p-3 border-[2px] rounded-lg transition-all hover:shadow-[2px_2px_0px_#5A3E36]"
      style={{ 
        backgroundColor: COLORS.background, 
        borderColor: COLORS.border 
      }}
    >
      {/* Icon */}
      <div 
        className="w-12 h-12 flex-shrink-0 flex items-center justify-center border-[2px] rounded-lg text-2xl"
        style={{ 
          backgroundColor: '#FFF9F5', 
          borderColor: COLORS.border 
        }}
      >
        {quest.icon || '⚔️'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 
          className="font-pixel text-sm uppercase truncate"
          style={{ color: COLORS.text }}
        >
          {quest.title}
        </h3>
        <p 
          className="text-xs mt-0.5 truncate"
          style={{ color: COLORS.textMuted }}
        >
          {quest.description}
        </p>

        {/* Progress Bar */}
        <div className="mt-2 flex items-center gap-2">
          <div 
            className="flex-1 h-4 border-[2px] overflow-hidden"
            style={{ 
              backgroundColor: COLORS.background, 
              borderColor: COLORS.border 
            }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: quest.status === 'CLAIMED' 
                  ? COLORS.buttonGreen 
                  : COLORS.buttonPink
              }}
            />
          </div>
          <span 
            className="text-xs font-bold min-w-[40px] text-right"
            style={{ color: COLORS.textMuted }}
          >
            {quest.currentProgress}/{quest.targetProgress}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        <QuestActionButton
          status={quest.status}
          rewardXP={quest.rewardXP}
          isClaiming={isClaiming}
          onClaim={onClaim}
          progress={`${quest.currentProgress}/${quest.targetProgress}`}
        />
      </div>
    </div>
  );
}

// ============================================
// QUEST ACTION BUTTON
// ============================================
interface QuestActionButtonProps {
  status: QuestStatus;
  rewardXP: number;
  isClaiming: boolean;
  onClaim: () => void;
  progress: string;
}

function QuestActionButton({ 
  status, 
  rewardXP, 
  isClaiming, 
  onClaim, 
  progress 
}: QuestActionButtonProps) {
  // State: In Progress
  if (status === 'IN_PROGRESS') {
    return (
      <div 
        className="px-3 py-2 border-[2px] rounded font-pixel text-xs uppercase cursor-default min-w-[70px] text-center"
        style={{ 
          backgroundColor: '#F5F5F5', 
          borderColor: COLORS.border,
          color: COLORS.border 
        }}
      >
        {progress}
      </div>
    );
  }

  // State: Claimed
  if (status === 'CLAIMED') {
    return (
      <div 
        className="flex items-center gap-1 px-3 py-2 border-[2px] rounded font-pixel text-xs uppercase min-w-[70px] justify-center"
        style={{ 
          backgroundColor: COLORS.buttonGreen, 
          borderColor: COLORS.border,
          color: COLORS.background 
        }}
      >
        <Check className="w-3 h-3" />
        DONE
      </div>
    );
  }

  // State: Completed (Claimable)
  return (
    <button
      onClick={onClaim}
      disabled={isClaiming}
      className="flex items-center gap-1 px-3 py-2 border-[2px] rounded font-pixel text-xs uppercase font-bold min-w-[70px] justify-center transition-all animate-bounce hover:animate-none hover:translate-y-[2px] active:shadow-none disabled:animate-none disabled:opacity-70"
      style={{ 
        backgroundColor: COLORS.buttonPink, 
        borderColor: COLORS.border,
        color: COLORS.border,
        boxShadow: isClaiming ? 'none' : `2px 2px 0px ${COLORS.border}`,
      }}
    >
      {isClaiming ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Trophy className="w-3 h-3" />
          CLAIM!
        </>
      )}
    </button>
  );
}

// ============================================
// LOADING SKELETON
// ============================================
function QuestBoardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div 
          key={i}
          className="flex items-center gap-3 p-3 border-[2px] rounded-lg animate-pulse"
          style={{ borderColor: COLORS.border }}
        >
          <div 
            className="w-12 h-12 rounded-lg"
            style={{ backgroundColor: '#E8D5C4' }}
          />
          <div className="flex-1 space-y-2">
            <div 
              className="h-4 rounded w-3/4"
              style={{ backgroundColor: '#E8D5C4' }}
            />
            <div 
              className="h-3 rounded w-1/2"
              style={{ backgroundColor: '#E8D5C4' }}
            />
            <div 
              className="h-4 rounded w-full border-[2px]"
              style={{ borderColor: COLORS.border, backgroundColor: '#F5F5F5' }}
            />
          </div>
          <div 
            className="w-16 h-8 rounded"
            style={{ backgroundColor: '#E8D5C4' }}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================
// ERROR STATE (Retro Glitch)
// ============================================
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div 
      className="p-6 border-[3px] border-dashed rounded-lg text-center"
      style={{ 
        backgroundColor: COLORS.errorBg, 
        borderColor: COLORS.errorText 
      }}
    >
      <div className="flex justify-center mb-3">
        <AlertTriangle className="w-10 h-10" style={{ color: COLORS.errorText }} />
      </div>
      <h3 
        className="font-pixel text-lg uppercase mb-1"
        style={{ color: COLORS.errorText }}
      >
        CONNECTION LOST...
      </h3>
      <p 
        className="text-sm mb-4"
        style={{ color: COLORS.textMuted }}
      >
        {error}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 mx-auto border-[2px] rounded font-pixel text-sm uppercase transition-all hover:translate-y-[1px]"
        style={{ 
          backgroundColor: COLORS.background, 
          borderColor: COLORS.border,
          color: COLORS.border,
          boxShadow: `2px 2px 0px ${COLORS.border}`,
        }}
      >
        <RefreshCw className="w-4 h-4" />
        RETRY
      </button>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState() {
  return (
    <div className="p-6 text-center">
      <div 
        className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-[3px] rounded-lg text-3xl"
        style={{ 
          backgroundColor: '#FFF9F5', 
          borderColor: COLORS.border 
        }}
      >
        🎯
      </div>
      <h3 
        className="font-pixel text-lg uppercase mb-1"
        style={{ color: COLORS.text }}
      >
        ALL QUESTS COMPLETE!
      </h3>
      <p 
        className="text-sm"
        style={{ color: COLORS.textMuted }}
      >
        Come back tomorrow for new adventures
      </p>
    </div>
  );
}

// ============================================
// EXPORTS
// ============================================
export { QuestItem, QuestActionButton, QuestBoardSkeleton, ErrorState, EmptyState };
