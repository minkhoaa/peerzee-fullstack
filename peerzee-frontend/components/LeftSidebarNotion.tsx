'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, MessageCircle, User, Hash, Users, Loader2, Gamepad2, Trophy, Heart } from 'lucide-react';
import { useRecentMatches } from '@/hooks/useWidgets';

const topics = ['Programming', 'IELTS', 'Career', 'LookingForTeam'];

/**
 * LeftSidebarNotion - Cute Retro OS styled navigation sidebar
 * "Game Menu" - Main navigation hub
 * Design: Cartridge-style menu items, thick borders, pixel accents
 */
export default function LeftSidebarNotion() {
    const pathname = usePathname();
    const { data: matches, isLoading } = useRecentMatches(5);

    return (
        <aside className="bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] sticky top-24 overflow-hidden">
            {/* Window Title Bar */}
            <div className="bg-pixel-blue border-b-4 border-cocoa px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pixel-red border-2 border-cocoa" />
                    <span className="w-3 h-3 rounded-full bg-pixel-yellow border-2 border-cocoa" />
                    <span className="w-3 h-3 rounded-full bg-pixel-green border-2 border-cocoa" />
                </div>
                <h2 className="font-pixel text-cocoa text-sm uppercase ml-2 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    Game Menu
                </h2>
            </div>

            <div className="p-4">
                {/* Main Navigation */}
                <nav className="space-y-2 mb-6">
                    <Link
                        href="/community"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-3 font-pixel text-sm uppercase transition-all ${pathname === '/community'
                            ? 'bg-pixel-pink border-cocoa text-cocoa shadow-[3px_3px_0_0_#5A3E36]'
                            : 'bg-white border-cocoa text-cocoa hover:bg-pixel-pink/30 shadow-[2px_2px_0_0_#8D6E63]'
                            }`}
                    >
                        <Home className="w-5 h-5" />
                        Home
                    </Link>
                    <Link
                        href="/discover"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-3 font-pixel text-sm uppercase transition-all ${pathname === '/discover'
                            ? 'bg-pixel-blue border-cocoa text-cocoa shadow-[3px_3px_0_0_#5A3E36]'
                            : 'bg-white border-cocoa text-cocoa hover:bg-pixel-blue/30 shadow-[2px_2px_0_0_#8D6E63]'
                            }`}
                    >
                        <Compass className="w-5 h-5" />
                        Discover
                    </Link>
                    <Link
                        href="/chat"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-3 font-pixel text-sm uppercase transition-all ${pathname === '/chat'
                            ? 'bg-pixel-green border-cocoa text-cocoa shadow-[3px_3px_0_0_#5A3E36]'
                            : 'bg-white border-cocoa text-cocoa hover:bg-pixel-green/30 shadow-[2px_2px_0_0_#8D6E63]'
                            }`}
                    >
                        <MessageCircle className="w-5 h-5" />
                        Messages
                    </Link>
                    <Link
                        href="/profile"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-3 font-pixel text-sm uppercase transition-all ${pathname === '/profile'
                            ? 'bg-pixel-yellow border-cocoa text-cocoa shadow-[3px_3px_0_0_#5A3E36]'
                            : 'bg-white border-cocoa text-cocoa hover:bg-pixel-yellow/30 shadow-[2px_2px_0_0_#8D6E63]'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        Profile
                    </Link>
                </nav>

                {/* Recent Matches - Party Members */}
                <div className="mb-6">
                    <h3 className="font-pixel text-xs text-cocoa uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pixel-pink" />
                        Party
                    </h3>
                    <div className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-3">
                                <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                            </div>
                        ) : matches && Array.isArray(matches) && matches.length > 0 ? (
                            matches.map((match) => (
                                <Link
                                    key={match.id}
                                    href={`/chat?conversation=${match.conversationId}`}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-cocoa bg-white text-cocoa hover:bg-pixel-pink/20 font-body text-sm transition-all shadow-[2px_2px_0_0_#8D6E63] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa font-pixel text-xs">
                                        {match.partner.display_name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate">{match.partner.display_name}</span>
                                </Link>
                            ))
                        ) : (
                            <p className="text-cocoa-light text-sm px-3 py-2 font-body">No matches yet</p>
                        )}
                        <Link
                            href="/chat"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-dashed border-cocoa-light text-cocoa-light hover:border-cocoa hover:text-cocoa font-pixel text-xs uppercase transition-all"
                        >
                            <Users className="w-4 h-4" />
                            <span>See All</span>
                        </Link>
                    </div>
                </div>

                {/* Topics - Quest Board */}
                <div>
                    <h3 className="font-pixel text-xs text-cocoa uppercase tracking-wider px-2 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-pixel-yellow" />
                        Quests
                    </h3>
                    <div className="space-y-2">
                        {topics.map((topic) => (
                            <Link
                                key={topic}
                                href={`/community?tag=${topic.toLowerCase()}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg border-2 border-cocoa bg-white text-cocoa hover:bg-pixel-blue/20 font-body text-sm transition-all shadow-[2px_2px_0_0_#8D6E63] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            >
                                <Hash className="w-4 h-4 text-pixel-blue" />
                                <span>{topic}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
