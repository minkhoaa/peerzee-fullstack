'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RPGHeaderProps {
    avatarUrl?: string;
    avatarFallback?: string;
    username: string;
    level?: number;
    hearts?: number;
    maxHearts?: number;
    isOnline?: boolean;
    subtitle?: string;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
    onMore?: () => void;
    actions?: React.ReactNode;
}

/**
 * RPGHeader - Pixel RPG styled header with avatar, level, and hearts
 * Features: LVL badge, heart icons for HP/affinity, pixel aesthetic
 */
export default function RPGHeader({
    avatarUrl,
    avatarFallback,
    username,
    level = 1,
    hearts = 3,
    maxHearts = 5,
    isOnline,
    subtitle,
    onAudioCall,
    onVideoCall,
    onMore,
    actions,
}: RPGHeaderProps) {
    // Generate heart icons
    const renderHearts = () => {
        const heartIcons = [];
        for (let i = 0; i < maxHearts; i++) {
            heartIcons.push(
                <span
                    key={i}
                    className={clsx(
                        'text-lg transition-all',
                        i < hearts
                            ? 'text-primary animate-pop'
                            : 'text-rpg-brown/20'
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                >
                    ♥
                </span>
            );
        }
        return heartIcons;
    };

    return (
        <div className="bg-white border-b-4 border-rpg-brown px-4 py-3 flex items-center justify-between">
            {/* Left: Avatar & User Info */}
            <div className="flex items-center gap-3">
                {/* Avatar with pixel border */}
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="w-12 h-12 border-2 border-rpg-brown object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-rpg-blue border-2 border-rpg-brown flex items-center justify-center font-display font-bold text-rpg-brown text-lg">
                            {avatarFallback || username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    
                    {/* Online indicator */}
                    {isOnline !== undefined && (
                        <div className={clsx(
                            'absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white',
                            isOnline ? 'bg-green-500' : 'bg-rpg-brown/40'
                        )} />
                    )}
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {/* Username */}
                        <span className="font-display font-bold text-rpg-brown text-base">
                            {username}
                        </span>
                        
                        {/* Level Badge */}
                        <span className="bg-rpg-brown text-white px-2 py-0.5 text-xs font-display font-bold">
                            LVL {level}
                        </span>
                    </div>
                    
                    {/* Hearts (Affinity/HP) or subtitle */}
                    {subtitle ? (
                        <span className={clsx(
                            'text-xs font-display',
                            isOnline ? 'text-green-600' : 'text-rpg-brown/60'
                        )}>
                            {subtitle}
                        </span>
                    ) : (
                        <div className="flex items-center gap-0.5">
                            {renderHearts()}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {onAudioCall && (
                    <button
                        onClick={onAudioCall}
                        className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                        title="Audio Call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>
                )}
                
                {onVideoCall && (
                    <button
                        onClick={onVideoCall}
                        className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                        title="Video Call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                )}
                
                {onMore && (
                    <button
                        onClick={onMore}
                        className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                        title="More options"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                )}
                
                {actions}
            </div>
        </div>
    );
}
