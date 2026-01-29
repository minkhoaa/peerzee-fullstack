'use client';

import React from 'react';
import { TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { useTrendingTags, useSuggestedUsers } from '@/hooks/useWidgets';

export default function RightSidebarNotion() {
    const { data: trendingTags, isLoading: loadingTags } = useTrendingTags(5);
    const { data: suggestedUsers, isLoading: loadingUsers } = useSuggestedUsers(3);

    return (
        <aside className="bg-retro-white border-3 border-cocoa rounded-xl p-5 shadow-pixel sticky top-24">
            {/* Trending */}
            <div className="mb-6">
                <h3 className="text-base font-pixel uppercase tracking-widest text-cocoa mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-pixel-pink" />
                    Trending
                </h3>
                <div className="flex flex-wrap gap-2">
                    {loadingTags ? (
                        <div className="flex items-center justify-center py-3 w-full">
                            <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                        </div>
                    ) : trendingTags && trendingTags.length > 0 ? (
                        trendingTags.map((topic) => (
                            <span
                                key={topic.tag}
                                className="bg-pixel-yellow text-cocoa px-3 py-1.5 rounded-lg border-2 border-cocoa text-sm font-bold inline-block hover:shadow-pixel-sm transition-all cursor-pointer"
                            >
                                #{topic.tag} <span className="text-cocoa-light text-xs ml-1">({topic.count})</span>
                            </span>
                        ))
                    ) : (
                        <p className="text-cocoa-light text-sm font-bold">No trending tags</p>
                    )}
                </div>
            </div>

            {/* Suggested */}
            <div className="mb-6">
                <h3 className="text-base font-pixel uppercase tracking-widest text-cocoa mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-pixel-purple" />
                    Suggested
                </h3>
                <div className="space-y-3">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                        </div>
                    ) : suggestedUsers && suggestedUsers.length > 0 ? (
                        suggestedUsers.map((peer) => (
                            <div key={peer.id} className="flex items-center gap-3 p-3 bg-retro-paper rounded-lg border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-blue/20 transition-all">
                                <div className="w-10 h-10 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa text-sm font-pixel shrink-0">
                                    {peer.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-cocoa text-sm font-bold truncate">{peer.display_name}</p>
                                    {peer.bio && <p className="text-cocoa-light text-xs truncate">{peer.bio}</p>}
                                </div>
                                <button className="px-3 py-1.5 text-xs font-pixel uppercase tracking-wider text-cocoa bg-pixel-green border-2 border-cocoa rounded-lg transition-colors shadow-pixel-sm hover:bg-pixel-green/80 active:translate-y-0.5 active:shadow-none">
                                    Follow
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-cocoa-light text-sm font-bold">No suggestions</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-cocoa-light space-x-2 font-bold">
                <a href="#" className="hover:text-cocoa">Terms</a>
                <span>·</span>
                <a href="#" className="hover:text-cocoa">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:text-cocoa">Help</a>
            </div>
        </aside>
    );
}
