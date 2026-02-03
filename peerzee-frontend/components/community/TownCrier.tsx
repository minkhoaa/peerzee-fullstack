'use client';

import React from 'react';
import { TrendingUp, Users, BookOpen, HelpCircle, Shield, User, Bird } from 'lucide-react';
import type { User as UserType, TrendingTopic } from '@/types/community';
import { getAssetUrl } from '@/lib/api';

interface TownCrierProps {
  trendingTopics: TrendingTopic[];
  newVillagers: UserType[];
  onTopicClick?: (tag: string) => void;
  onVillagerClick?: (userId: string) => void;
}

/**
 * TownCrier - Right sidebar component
 * Fresh Sage & Cool Taupe palette with high contrast
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
      <div className="border-3 border-cocoa p-4 bg-retro-paper shadow-pixel">
        <h2 className="font-pixel text-xl text-center uppercase tracking-wide text-cocoa font-bold">
          TOWN CRIER
        </h2>
        <p className="text-xs text-center uppercase tracking-widest mt-1 font-body font-bold text-cocoa-light">
          EXTRA! EXTRA!
        </p>
      </div>

      {/* Talk of the Town (Trending) */}
      <div className="border-3 border-cocoa p-4 bg-retro-paper shadow-pixel">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-pixel-pink" strokeWidth={2.5} />
          <h3 className="font-pixel text-sm uppercase text-cocoa font-bold">
            TALK OF THE TOWN
          </h3>
        </div>

        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onTopicClick?.(topic.tag)}
              className="w-full flex items-center justify-between py-1.5 hover:bg-retro-bg transition-colors rounded px-2 -mx-2"
            >
              <span className="text-sm font-body font-bold text-cocoa">
                {topic.tag}
              </span>
              {/* Paper Label Badge - solid opaque parchment */}
              <span className="text-xs font-pixel px-2 py-1 border-2 border-cocoa bg-parchment text-cocoa font-bold shadow-pixel-sm">
                {topic.postCount > 999 ? `${(topic.postCount / 1000).toFixed(1)}k` : topic.postCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* New Villagers */}
      <div className="border-3 border-cocoa p-4 bg-retro-paper shadow-pixel">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
          <h3 className="font-pixel text-sm uppercase text-cocoa font-bold">
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
              <div className="w-full aspect-square rounded-lg border-2 border-cocoa overflow-hidden bg-retro-white">
                {villager.avatarUrl ? (
                  <img
                    src={getAssetUrl(villager.avatarUrl)}
                    alt={villager.username}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cocoa/10">
                    <User className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              {villager.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-retro-white rounded-full bg-pixel-green" />
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-pixel opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 bg-cocoa text-retro-white border-2 border-cocoa">
                {villager.username}
              </div>
            </button>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-3 p-2 flex items-center justify-center bg-retro-white border-2 border-cocoa">
          <Bird className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-3 border-cocoa p-3 bg-retro-paper shadow-pixel">
        <div className="flex items-center justify-center gap-4">
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:text-pixel-pink transition-colors text-cocoa font-bold">
            <BookOpen className="w-3 h-3" strokeWidth={2.5} />
            RULES
          </button>
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:text-pixel-pink transition-colors text-cocoa font-bold">
            <HelpCircle className="w-3 h-3" strokeWidth={2.5} />
            HELP
          </button>
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:text-pixel-pink transition-colors text-cocoa font-bold">
            <Shield className="w-3 h-3" strokeWidth={2.5} />
            PRIVACY
          </button>
        </div>
      </div>
    </div>
  );
}

export default TownCrier;
