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
        <aside className="h-full py-4 pr-4">
            {/* Main Navigation */}
            <nav className="space-y-0.5 mb-6">
                <Link
                    href="/community"
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === '/community'
                            ? 'bg-[#2F2F2F] text-[#E3E3E3]'
                            : 'text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3]'
                        }`}
                >
                    <Home className="w-4 h-4" />
                    Home
                </Link>
                <Link
                    href="/discover"
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === '/discover'
                            ? 'bg-[#2F2F2F] text-[#E3E3E3]'
                            : 'text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3]'
                        }`}
                >
                    <Compass className="w-4 h-4" />
                    Discover
                </Link>
                <Link
                    href="/chat"
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === '/chat'
                            ? 'bg-[#2F2F2F] text-[#E3E3E3]'
                            : 'text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3]'
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Messages
                </Link>
                <Link
                    href="/profile"
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${pathname === '/profile'
                            ? 'bg-[#2F2F2F] text-[#E3E3E3]'
                            : 'text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3]'
                        }`}
                >
                    <User className="w-4 h-4" />
                    Profile
                </Link>
            </nav>

            {/* Matches */}
            <div className="mb-6">
                <h3 className="text-[10px] font-medium text-[#9B9A97] uppercase tracking-wider px-2 mb-2">
                    Matches
                </h3>
                <div className="space-y-0.5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="w-4 h-4 text-[#9B9A97] animate-spin" />
                        </div>
                    ) : matches && matches.length > 0 ? (
                        matches.map((match) => (
                            <Link
                                key={match.id}
                                href={`/chat?conversation=${match.conversationId}`}
                                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3] transition-colors"
                            >
                                <div className="w-5 h-5 rounded bg-[#37352F] flex items-center justify-center text-[#E3E3E3] text-[8px] font-medium">
                                    {match.partner.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="truncate">{match.partner.display_name}</span>
                            </Link>
                        ))
                    ) : (
                        <p className="text-[#9B9A97] text-xs px-2">No matches yet</p>
                    )}
                    <Link
                        href="/chat"
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3] transition-colors"
                    >
                        <Users className="w-4 h-4" />
                        <span>See all</span>
                    </Link>
                </div>
            </div>

            {/* Topics */}
            <div>
                <h3 className="text-[10px] font-medium text-[#9B9A97] uppercase tracking-wider px-2 mb-2">
                    Topics
                </h3>
                <div className="space-y-0.5">
                    {topics.map((topic) => (
                        <Link
                            key={topic}
                            href={`/community?tag=${topic.toLowerCase()}`}
                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3] transition-colors"
                        >
                            <Hash className="w-4 h-4" />
                            <span>{topic}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
