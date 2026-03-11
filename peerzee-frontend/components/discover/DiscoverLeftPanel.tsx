'use client';

import React from 'react';
import { getAssetUrl } from '@/lib/api';

interface DiscoverLeftPanelProps {
    userAvatar?: string;
    userName?: string;
    stats: { matches: number; likes: number; views: number } | null;
    onSearchClick: () => void;
}

export default function DiscoverLeftPanel({ userAvatar, userName, stats, onSearchClick }: DiscoverLeftPanelProps) {
    const initial = (userName || '?').slice(0, 1).toUpperCase();
    const avatarUrl = getAssetUrl(userAvatar);

    return (
        <div className="h-full flex flex-col bg-retro-paper border-2 border-cocoa rounded-xl p-4 gap-4 shadow-pixel">
            {/* User mini-profile */}
            <div className="flex flex-col items-center gap-2 pt-2">
                <div className="w-14 h-14 rounded-xl border-2 border-cocoa bg-pixel-pink shadow-pixel-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={userName || ''} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-cocoa font-pixel text-xl">{initial}</span>
                    )}
                </div>
                {userName && (
                    <span className="text-xs font-pixel text-cocoa uppercase tracking-widest truncate max-w-full">
                        {userName}
                    </span>
                )}
            </div>

            <div className="h-px bg-cocoa/20" />

            {/* Stats */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center bg-retro-white border-2 border-cocoa rounded-lg py-3 shadow-pixel-sm">
                    <span className="text-2xl font-pixel text-cocoa leading-none">
                        {stats?.matches ?? '—'}
                    </span>
                    <span className="text-[10px] text-cocoa-light uppercase tracking-widest mt-1">Ghép đôi</span>
                </div>
                <div className="flex flex-col items-center bg-retro-white border-2 border-cocoa rounded-lg py-3 shadow-pixel-sm">
                    <span className="text-2xl font-pixel text-cocoa leading-none">
                        {stats?.likes ?? '—'}
                    </span>
                    <span className="text-[10px] text-cocoa-light uppercase tracking-widest mt-1">Được thích</span>
                </div>
                <div className="flex flex-col items-center bg-retro-white border-2 border-cocoa rounded-lg py-3 shadow-pixel-sm">
                    <span className="text-2xl font-pixel text-cocoa leading-none">
                        {stats?.views ?? '—'}
                    </span>
                    <span className="text-[10px] text-cocoa-light uppercase tracking-widest mt-1">Lượt xem</span>
                </div>
            </div>

            <div className="mt-auto">
                <button
                    onClick={onSearchClick}
                    className="w-full py-2.5 bg-pixel-purple text-white border-2 border-cocoa rounded-lg font-pixel text-xs uppercase tracking-widest shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all active:translate-y-1"
                >
                    Tìm kiếm AI
                </button>
            </div>
        </div>
    );
}
