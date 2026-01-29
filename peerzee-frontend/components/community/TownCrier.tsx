'use client';

import React from 'react';
import { TrendingUp, Users, BookOpen, HelpCircle, Shield, User, Bird } from 'lucide-react';
import type { User as UserType, TrendingTopic } from '@/types/community';

interface TownCrierProps {
  trendingTopics: TrendingTopic[];
  newVillagers: UserType[];
  onTopicClick?: (tag: string) => void;
  onVillagerClick?: (userId: string) => void;
}

/**
 * TownCrier - Right sidebar component
 * Retro Pixel OS design system
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
      <div className="border-3 border-cocoa p-4 bg-retro-cream shadow-pixel">
        <h2 className="font-pixel text-xl text-center uppercase tracking-wide text-cocoa">
          TOWN CRIER
        </h2>
        <p className="text-xs text-center uppercase tracking-widest mt-1 font-body font-bold text-cocoa-light">
          EXTRA! EXTRA!
        </p>
      </div>

      {/* Talk of the Town (Trending) */}
      <div className="border-3 border-cocoa p-4 bg-retro-cream shadow-pixel">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-pixel-pink" />
          <h3 className="font-pixel text-sm uppercase text-cocoa">
            TALK OF THE TOWN
          </h3>
        </div>

        <div className="space-y-2">
          {trendingTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onTopicClick?.(topic.tag)}
              className="w-full flex items-center justify-between py-1.5 hover:bg-cocoa/10 transition-colors rounded px-2 -mx-2"
            >
              <span className="text-sm font-body font-bold text-pixel-pink">
                {topic.tag}
              </span>
              <span className="text-xs font-pixel px-2 py-0.5 border border-cocoa bg-cocoa/10 text-cocoa-light">
                {topic.postCount > 999 ? `${(topic.postCount / 1000).toFixed(1)}k` : topic.postCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* New Villagers */}
      <div className="border-3 border-cocoa p-4 bg-retro-cream shadow-pixel">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cocoa" />
          <h3 className="font-pixel text-sm uppercase text-cocoa">
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
              <div className="w-full aspect-square border-2 border-cocoa overflow-hidden">
                {villager.avatarUrl ? (
                  <img
                    src={villager.avatarUrl}
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
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full bg-pixel-mint" />
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-pixel opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 bg-cocoa text-white">
                {villager.username}
              </div>
            </button>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-3 p-2 flex items-center justify-center bg-cocoa/10">
          <Bird className="w-6 h-6 text-cocoa-light" strokeWidth={2.5} />
        </div>
      </div>

      {/* Footer Links */}
      <div className="border-3 border-cocoa p-3 bg-retro-cream shadow-pixel">
        <div className="flex items-center justify-center gap-4">
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline text-cocoa-light">
            <BookOpen className="w-3 h-3" />
            RULES
          </button>
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline text-cocoa-light">
            <HelpCircle className="w-3 h-3" />
            HELP
          </button>
          <button className="flex items-center gap-1 text-xs font-pixel uppercase hover:underline text-cocoa-light">
            <Shield className="w-3 h-3" />
            PRIVACY
          </button>
        </div>
      </div>
    </div>
  );
}

export default TownCrier;
