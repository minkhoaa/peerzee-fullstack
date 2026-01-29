'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Globe, MessageSquareText, User, Hash, Users, Loader2 } from 'lucide-react';
import { useRecentMatches } from '@/hooks/useWidgets';

const topics = ['Programming', 'IELTS', 'Career', 'LookingForTeam'];

export default function LeftSidebarNotion() {
    const pathname = usePathname();
    const { data: matches, isLoading } = useRecentMatches(5);

    return (
        <aside className="bg-retro-white border-3 border-cocoa rounded-xl p-5 shadow-pixel sticky top-24">
            {/* Main Navigation */}
            <nav className="space-y-2 mb-6">
                <Link
                    href="/community"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-base font-bold transition-all ${pathname === '/community'
                            ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm'
                            : 'border-transparent text-cocoa-light hover:bg-pixel-blue/30 hover:border-cocoa hover:text-cocoa'
                        }`}
                >
                    <Home className="w-5 h-5" strokeWidth={2.5} />
                    Home
                </Link>
                <Link
                    href="/discover"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-base font-bold transition-all ${pathname === '/discover'
                            ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm'
                            : 'border-transparent text-cocoa-light hover:bg-pixel-blue/30 hover:border-cocoa hover:text-cocoa'
                        }`}
                >
                    <Globe className="w-5 h-5" strokeWidth={2.5} />
                    Discover
                </Link>
                <Link
                    href="/chat"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-base font-bold transition-all ${pathname === '/chat'
                            ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm'
                            : 'border-transparent text-cocoa-light hover:bg-pixel-blue/30 hover:border-cocoa hover:text-cocoa'
                        }`}
                >
                    <MessageSquareText className="w-5 h-5" strokeWidth={2.5} />
                    Messages
                </Link>
                <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 text-base font-bold transition-all ${pathname === '/profile'
                            ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm'
                            : 'border-transparent text-cocoa-light hover:bg-pixel-blue/30 hover:border-cocoa hover:text-cocoa'
                        }`}
                >
                    <User className="w-5 h-5" strokeWidth={2.5} />
                    Profile
                </Link>
            </nav>

            {/* Matches */}
            <div className="mb-6">
                <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa px-2 mb-3">
                    Recent Matches
                </h3>
                <div className="space-y-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                        </div>
                    ) : matches && Array.isArray(matches) && matches.length > 0 ? (
                        matches.map((match) => (
                            <Link
                                key={match.id}
                                href={`/chat?conversation=${match.conversationId}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-cocoa-light hover:bg-pixel-purple/20 hover:text-cocoa transition-colors border-2 border-transparent hover:border-cocoa"
                            >
                                <div className="w-8 h-8 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa text-xs font-pixel shadow-pixel-sm">
                                    {match.partner.display_name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="truncate">{match.partner.display_name}</span>
                            </Link>
                        ))
                    ) : (
                        <p className="text-cocoa-light text-sm px-3 py-2 font-bold">No matches yet</p>
                    )}
                    <Link
                        href="/chat"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-pixel-pink hover:bg-pixel-pink/20 transition-colors"
                    >
                        <Users className="w-5 h-5" strokeWidth={2.5} />
                        <span>See all</span>
                    </Link>
                </div>
            </div>

            {/* Topics */}
            <div>
                <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa px-2 mb-3">
                    Topics
                </h3>
                <div className="space-y-1">
                    {topics.map((topic) => (
                        <Link
                            key={topic}
                            href={`/community?tag=${topic.toLowerCase()}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-cocoa-light hover:bg-pixel-yellow/30 hover:text-cocoa transition-colors border-2 border-transparent hover:border-cocoa"
                        >
                            <Hash className="w-5 h-5" strokeWidth={2.5} />
                            <span>{topic}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
