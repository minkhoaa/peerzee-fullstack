'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, User, Hash, Users, Loader2 } from 'lucide-react';
import { useRecentMatches } from '@/hooks/useWidgets';

const topics = ['Programming', 'IELTS', 'Career', 'LookingForTeam'];

export default function LeftSidebarNotion() {
    const pathname = usePathname();
    const { data: matches, isLoading } = useRecentMatches(5);

    return (
        <aside className="bg-[#FDF0F1] rounded-[30px] p-6 shadow-xl shadow-[#CD6E67]/10 sticky top-24">
            {/* Main Navigation */}
            <nav className="space-y-1 mb-6">
                <Link
                    href="/community"
                    className={`flex items-center gap-3 px-4 py-3 rounded-[20px] text-lg font-bold transition-all ${pathname === '/community'
                            ? 'bg-[#CD6E67] text-white shadow-lg shadow-[#CD6E67]/30'
                            : 'text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229]'
                        }`}
                >
                    <Home className="w-5 h-5" />
                    Home
                </Link>
                <Link
                    href="/discover"
                    className={`flex items-center gap-3 px-4 py-3 rounded-[20px] text-lg font-bold transition-all ${pathname === '/discover'
                            ? 'bg-[#CD6E67] text-white shadow-lg shadow-[#CD6E67]/30'
                            : 'text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229]'
                        }`}
                >
                    <Compass className="w-5 h-5" />
                    Discover
                </Link>
                <Link
                    href="/chat"
                    className={`flex items-center gap-3 px-4 py-3 rounded-[20px] text-lg font-bold transition-all ${pathname === '/chat'
                            ? 'bg-[#CD6E67] text-white shadow-lg shadow-[#CD6E67]/30'
                            : 'text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229]'
                        }`}
                >
                    <MessageCircle className="w-5 h-5" />
                    Messages
                </Link>
                <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 rounded-[20px] text-lg font-bold transition-all ${pathname === '/profile'
                            ? 'bg-[#CD6E67] text-white shadow-lg shadow-[#CD6E67]/30'
                            : 'text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229]'
                        }`}
                >
                    <User className="w-5 h-5" />
                    Profile
                </Link>
            </nav>

            {/* Matches */}
            <div className="mb-6">
                <h3 className="text-xs font-black text-[#7A6862] uppercase tracking-wider px-2 mb-3">
                    Recent Matches
                </h3>
                <div className="space-y-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-5 h-5 text-[#CD6E67] animate-spin" />
                        </div>
                    ) : matches && Array.isArray(matches) && matches.length > 0 ? (
                        matches.map((match) => (
                            <Link
                                key={match.id}
                                href={`/chat?conversation=${match.conversationId}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-[15px] text-sm font-bold text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-[#CD6E67] flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                                    {match.partner.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="truncate">{match.partner.display_name}</span>
                            </Link>
                        ))
                    ) : (
                        <p className="text-[#7A6862] text-sm px-3 py-2">No matches yet</p>
                    )}
                    <Link
                        href="/chat"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[15px] text-sm font-bold text-[#CD6E67] hover:bg-[#F8E3E6] transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        <span>See all</span>
                    </Link>
                </div>
            </div>

            {/* Topics */}
            <div>
                <h3 className="text-xs font-black text-[#7A6862] uppercase tracking-wider px-2 mb-3">
                    Topics
                </h3>
                <div className="space-y-1">
                    {topics.map((topic) => (
                        <Link
                            key={topic}
                            href={`/community?tag=${topic.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-[15px] text-sm font-bold text-[#7A6862] hover:bg-[#F8E3E6] hover:text-[#3E3229] transition-colors"
                        >
                            <Hash className="w-5 h-5" />
                            <span>{topic}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
