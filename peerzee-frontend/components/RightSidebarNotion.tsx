'use client';

import React from 'react';
import { TrendingUp, UserPlus, Loader2 } from 'lucide-react';
import { useTrendingTags, useSuggestedUsers } from '@/hooks/useWidgets';

export default function RightSidebarNotion() {
    const { data: trendingTags, isLoading: loadingTags } = useTrendingTags(5);
    const { data: suggestedUsers, isLoading: loadingUsers } = useSuggestedUsers(3);

    return (
        <aside className="bg-[#FDF0F1] rounded-[30px] p-6 shadow-xl shadow-[#CD6E67]/10 sticky top-24">
            {/* Trending */}
            <div className="mb-8">
                <h3 className="text-xl font-black text-[#3E3229] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#CD6E67]" />
                    Trending Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                    {loadingTags ? (
                        <div className="flex items-center justify-center py-3 w-full">
                            <Loader2 className="w-5 h-5 text-[#CD6E67] animate-spin" />
                        </div>
                    ) : trendingTags && trendingTags.length > 0 ? (
                        trendingTags.map((topic) => (
                            <span
                                key={topic.tag}
                                className="bg-white text-[#CD6E67] px-4 py-2 rounded-[12px] text-sm font-bold inline-block hover:shadow-md transition-all cursor-pointer shadow-sm"
                            >
                                #{topic.tag} <span className="text-[#7A6862] text-xs ml-1">({topic.count})</span>
                            </span>
                        ))
                    ) : (
                        <p className="text-[#7A6862] text-sm">No trending tags</p>
                    )}
                </div>
            </div>

            {/* Suggested */}
            <div className="mb-8">
                <h3 className="text-xl font-black text-[#3E3229] mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#CD6E67]" />
                    Suggested For You
                </h3>
                <div className="space-y-4">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-5 h-5 text-[#CD6E67] animate-spin" />
                        </div>
                    ) : suggestedUsers && suggestedUsers.length > 0 ? (
                        suggestedUsers.map((peer) => (
                            <div key={peer.id} className="flex items-center gap-3 p-3 bg-white rounded-[20px] shadow-sm hover:shadow-md hover:shadow-[#CD6E67]/10 transition-all">
                                <div className="w-10 h-10 rounded-full bg-[#CD6E67] flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-sm">
                                    {peer.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#3E3229] text-sm font-bold truncate">{peer.display_name}</p>
                                    {peer.bio && <p className="text-[#7A6862] text-xs truncate">{peer.bio}</p>}
                                </div>
                                <button className="px-3 py-1.5 text-xs font-bold text-white bg-[#CD6E67] hover:bg-[#B55B55] rounded-full transition-colors shadow-sm">
                                    Follow
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-[#7A6862] text-sm">No suggestions</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-xs text-[#7A6862] space-x-2 font-medium">
                <a href="#" className="hover:text-[#3E3229]">Terms</a>
                <span>·</span>
                <a href="#" className="hover:text-[#3E3229]">Privacy</a>
                <span>·</span>
                <a href="#" className="hover:text-[#3E3229]">Help</a>
            </div>
        </aside>
    );
}
