'use client';

import React from 'react';
import { TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { useTrendingTags, useSuggestedUsers } from '@/hooks/useWidgets';

export default function RightSidebarNotion() {
    const { data: trendingTags, isLoading: loadingTags } = useTrendingTags(5);
    const { data: suggestedUsers, isLoading: loadingUsers } = useSuggestedUsers(3);

    return (
        <aside className="h-full py-4 pl-4">
            {/* Trending */}
            <div className="mb-8">
                <h3 className="text-[10px] font-medium text-[#9B9A97] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                </h3>
                <div className="space-y-2">
                    {loadingTags ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 text-[#9B9A97] animate-spin" />
                        </div>
                    ) : trendingTags && trendingTags.length > 0 ? (
                        trendingTags.map((topic, index) => (
                            <div
                                key={topic.tag}
                                className="flex items-center justify-between py-1 cursor-pointer group"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-[#9B9A97] text-xs w-4">{index + 1}</span>
                                    <span className="text-[#E3E3E3] text-sm group-hover:text-white transition-colors">
                                        #{topic.tag}
                                    </span>
                                </div>
                                <span className="text-[#9B9A97] text-xs">{topic.count}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-[#9B9A97] text-xs">No trending tags</p>
                    )}
                </div>
            </div>

            {/* Suggested */}
            <div className="mb-8">
                <h3 className="text-[10px] font-medium text-[#9B9A97] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <UserPlus className="w-3 h-3" />
                    Suggested
                </h3>
                <div className="space-y-3">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 text-[#9B9A97] animate-spin" />
                        </div>
                    ) : suggestedUsers && suggestedUsers.length > 0 ? (
                        suggestedUsers.map((peer) => (
                            <div key={peer.id} className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-md bg-[#37352F] flex items-center justify-center text-[#E3E3E3] text-xs shrink-0">
                                    {peer.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#E3E3E3] text-sm truncate">{peer.display_name}</p>
                                    {peer.bio && <p className="text-[#9B9A97] text-xs truncate">{peer.bio}</p>}
                                </div>
                                <button className="px-2 py-1 text-xs text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors">
                                    +
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-[#9B9A97] text-xs">No suggestions</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-[10px] text-[#9B9A97] space-x-2">
                <a href="#" className="hover:text-[#E3E3E3]">Terms</a>
                <span>·</span>
                <a href="#" className="hover:text-[#E3E3E3]">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:text-[#E3E3E3]">Help</a>
            </div>
        </aside>
    );
}
