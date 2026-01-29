'use client';

import React from 'react';
import { TrendingUp, Users, BookOpen, HelpCircle, Shield, User, Bird } from 'lucide-react';
import type { User as UserType, TrendingTopic } from '@/types/community';

// ============================================
// VILLAGE THEME COLORS
// ============================================
const COLORS = {
  parchment: '#FDF5E6',
  parchmentDark: '#F5E6D3',
  wood: '#8B5A2B',
  woodDark: '#4A3B32',
  text: '#3E2723',
  textMuted: '#795548',
  orange: '#E65100',
  green: '#2E7D32',
  scrollBg: '#E8DCC8',
} as const;

interface TownCrierProps {
  trendingTopics: TrendingTopic[];
  newVillagers: UserType[];
  onTopicClick?: (tag: string) => void;
  onVillagerClick?: (userId: string) => void;
}

/**
 * TownCrier - Right sidebar component
 * "Town Crier - Extra! Extra!" style
 */
export function TownCrier({
  trendingTopics,
  newVillagers,
  onTopicClick,
  onVillagerClick,
}: TownCrierProps) {
  return (
    <div className="space-y-4">
      {/* Town Crier Header */}
      <div
        className="border-4 p-4"
        style={{
          backgroundColor: COLORS.parchment,
          borderColor: COLORS.woodDark,
          boxShadow: '4px 4px 8px rgba(0,0,0,0.15)',
        }}
      >
        <h2
          className="font-pixel text-xl text-center uppercase tracking-wide"
          style={{ color: COLORS.text }}
        >
          TOWN CRIER
        </h2>
        <p
          className="text-xs text-center uppercase tracking-widest mt-1"
          style={{ color: COLORS.textMuted }}
        >
          EXTRA! EXTRA!
        </p>
      </div>

      {/* Talk of the Town (Trending) */}
      <div
        className="border-4 p-4"
        style={{
          backgroundColor: COLORS.parchment,
          borderColor: COLORS.woodDark,
          boxShadow: '4px 4px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: COLORS.orange }} />
          <h3
            className="font-pixel text-sm uppercase"
            style={{ color: COLORS.text }}
          >
            TALK OF THE TOWN
          </h3>
        </div>

        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onTopicClick?.(topic.tag)}
              className="w-full flex items-center justify-between py-1.5 hover:bg-black/5 transition-colors rounded px-2 -mx-2"
            >
              <span
                className="text-sm font-medium"
                style={{ color: COLORS.orange }}
              >
                {topic.tag}
              </span>
              <span
                className="text-xs font-pixel px-2 py-0.5 border"
                style={{
                  backgroundColor: COLORS.parchmentDark,
                  borderColor: COLORS.wood,
                  color: COLORS.textMuted,
                }}
              >
                {topic.postCount > 999 ? `${(topic.postCount / 1000).toFixed(1)}k` : topic.postCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* New Villagers */}
      <div
        className="border-4 p-4"
        style={{
          backgroundColor: COLORS.parchment,
          borderColor: COLORS.woodDark,
          boxShadow: '4px 4px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4" style={{ color: COLORS.text }} />
          <h3
            className="font-pixel text-sm uppercase"
            style={{ color: COLORS.text }}
          >
            NEW VILLAGERS
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {newVillagers.slice(0, 8).map((villager) => (
            <button
              key={villager.id}
              onClick={() => onVillagerClick?.(villager.id)}
              className="relative group"
            >
              <div
                className="w-full aspect-square border-2 overflow-hidden"
                style={{ borderColor: COLORS.woodDark }}
              >
                {villager.avatarUrl ? (
                  <img
                    src={villager.avatarUrl}
                    alt={villager.username}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.parchmentDark }}
                  >
                    <User className="w-4 h-4" strokeWidth={2.5} style={{ color: COLORS.text }} />
                  </div>
                )}
              </div>
              {villager.isOnline && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full"
                  style={{ backgroundColor: COLORS.green }}
                />
              )}
              {/* Tooltip */}
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-pixel opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                style={{
                  backgroundColor: COLORS.woodDark,
                  color: '#FFF',
                }}
              >
                {villager.username}
              </div>
            </button>
          ))}
        </div>

        {/* Scroll indicator */}
        <div
          className="mt-3 p-2 flex items-center justify-center"
          style={{ backgroundColor: COLORS.parchmentDark }}
        >
          <Bird className="w-6 h-6" strokeWidth={2.5} style={{ color: COLORS.wood }} />
        </div>
      </div>

      {/* Footer Links */}
      <div
        className="border-4 p-3"
        style={{
          backgroundColor: COLORS.parchment,
          borderColor: COLORS.woodDark,
          boxShadow: '4px 4px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <button
            className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline"
            style={{ color: COLORS.textMuted }}
          >
            <BookOpen className="w-3 h-3" />
            RULES
          </button>
          <button
            className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline"
            style={{ color: COLORS.textMuted }}
          >
            <HelpCircle className="w-3 h-3" />
            HELP
          </button>
          <button
            className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline"
            style={{ color: COLORS.textMuted }}
          >
            <Shield className="w-3 h-3" />
            PRIVACY
          </button>
        </div>
      </div>
    </div>
  );
}

export default TownCrier;
