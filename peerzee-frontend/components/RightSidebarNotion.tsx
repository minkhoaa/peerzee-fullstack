'use client';

import React from 'react';
import { TrendingUp, UserPlus, Loader2, Star, Crown, Sparkles } from 'lucide-react';
import { useTrendingTags, useSuggestedUsers } from '@/hooks/useWidgets';

/**
 * RightSidebarNotion - Cute Retro OS styled right sidebar
 * "High Scores & Leaderboard" - Rankings and suggestions
 * Design: Trophy badges, pixel stars, thick borders
 */
export default function RightSidebarNotion() {
    const { data: trendingTags, isLoading: loadingTags } = useTrendingTags(5);
    const { data: suggestedUsers, isLoading: loadingUsers } = useSuggestedUsers(3);

    return (
        <aside className="sticky top-24 space-y-4">
            {/* Trending Topics - Hot Quests */}
            <div className="bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] overflow-hidden">
                {/* Window Title Bar */}
                <div className="bg-pixel-yellow border-b-4 border-cocoa px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-pixel-red border-2 border-cocoa" />
                        <span className="w-3 h-3 rounded-full bg-pixel-yellow border-2 border-cocoa" />
                        <span className="w-3 h-3 rounded-full bg-pixel-green border-2 border-cocoa" />
                    </div>
                    <h3 className="font-pixel text-cocoa text-sm uppercase ml-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Hot Quests
                    </h3>
                </div>

                <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                        {loadingTags ? (
                            <div className="flex items-center justify-center py-3 w-full">
                                <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                            </div>
                        ) : trendingTags && trendingTags.length > 0 ? (
                            trendingTags.map((topic, index) => (
                                <span
                                    key={topic.tag}
                                    className="bg-white text-cocoa px-3 py-1.5 rounded-lg border-2 border-cocoa font-body text-sm inline-flex items-center gap-1.5 hover:bg-pixel-blue/30 transition-all cursor-pointer shadow-[2px_2px_0_0_#8D6E63] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    {index === 0 && <Star className="w-3.5 h-3.5 text-pixel-yellow fill-pixel-yellow" />}
                                    #{topic.tag}
                                    <span className="text-cocoa-light text-xs">({topic.count})</span>
                                </span>
                            ))
                        ) : (
                            <p className="text-cocoa-light text-sm font-body">No trending tags</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Suggested Users - New Players */}
            <div className="bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] overflow-hidden">
                {/* Window Title Bar */}
                <div className="bg-pixel-green border-b-4 border-cocoa px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-pixel-red border-2 border-cocoa" />
                        <span className="w-3 h-3 rounded-full bg-pixel-yellow border-2 border-cocoa" />
                        <span className="w-3 h-3 rounded-full bg-pixel-green border-2 border-cocoa" />
                    </div>
                    <h3 className="font-pixel text-cocoa text-sm uppercase ml-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        New Players
                    </h3>
                </div>

                <div className="p-4 space-y-3">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                        </div>
                    ) : suggestedUsers && suggestedUsers.length > 0 ? (
                        suggestedUsers.map((peer, index) => (
                            <div
                                key={peer.id}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border-3 border-cocoa shadow-[2px_2px_0_0_#8D6E63] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa font-pixel text-sm shrink-0">
                                        {peer.display_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    {index === 0 && (
                                        <Crown className="absolute -top-2 -right-2 w-5 h-5 text-pixel-yellow fill-pixel-yellow" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-cocoa font-pixel text-sm uppercase truncate">{peer.display_name}</p>
                                    {peer.bio && <p className="text-cocoa-light font-body text-xs truncate">{peer.bio}</p>}
                                </div>
                                <button className="px-3 py-1.5 font-pixel text-xs text-cocoa uppercase bg-pixel-blue border-2 border-cocoa rounded-lg shadow-[2px_2px_0_0_#5A3E36] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                    Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-cocoa-light text-sm font-body">No suggestions</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-retro-paper border-4 border-cocoa rounded-xl p-4 shadow-[4px_4px_0_0_#8D6E63]">
                <div className="font-body text-xs text-cocoa-light space-x-2">
                    <a href="#" className="hover:text-cocoa transition-colors">Terms</a>
                    <span>·</span>
                    <a href="#" className="hover:text-cocoa transition-colors">Privacy</a>
                    <span>·</span>
                    <a href="#" className="hover:text-cocoa transition-colors">Help</a>
                </div>
                <p className="font-pixel text-xs text-cocoa-light mt-2 uppercase">© 2024 Peerzee</p>
            </div>
        </aside>
    );
}
