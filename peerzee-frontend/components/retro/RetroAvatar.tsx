'use client';

import React from 'react';
import { clsx } from 'clsx';

interface RetroAvatarProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isOnline?: boolean;
    level?: number;
    className?: string;
}

/**
 * RetroAvatar - Cute Retro OS styled avatar
 * Features: Thick cocoa border, optional online indicator, level badge
 */
export default function RetroAvatar({
    src,
    alt = 'Avatar',
    fallback,
    size = 'md',
    isOnline,
    level,
    className,
}: RetroAvatarProps) {
    const sizeStyles = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
    };

    const borderSize = {
        sm: 'border-2',
        md: 'border-3',
        lg: 'border-3',
        xl: 'border-4',
    };

    const onlineSize = {
        sm: 'w-2.5 h-2.5 border',
        md: 'w-3 h-3 border-2',
        lg: 'w-3.5 h-3.5 border-2',
        xl: 'w-4 h-4 border-2',
    };

    return (
        <div className={clsx('relative inline-block', className)}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className={clsx(
                        'rounded-lg object-cover bg-pixel-pink',
                        sizeStyles[size],
                        borderSize[size],
                        'border-cocoa shadow-[2px_2px_0_0_#5A3E36]'
                    )}
                />
            ) : (
                <div
                    className={clsx(
                        'rounded-lg bg-pixel-pink flex items-center justify-center font-pixel text-cocoa uppercase',
                        sizeStyles[size],
                        borderSize[size],
                        'border-cocoa shadow-[2px_2px_0_0_#5A3E36]'
                    )}
                >
                    {fallback || '?'}
                </div>
            )}
            
            {/* Online Indicator */}
            {isOnline !== undefined && (
                <div
                    className={clsx(
                        'absolute -bottom-0.5 -right-0.5 rounded-sm border-white',
                        onlineSize[size],
                        isOnline ? 'bg-pixel-green' : 'bg-cocoa-light'
                    )}
                />
            )}
            
            {/* Level Badge */}
            {level !== undefined && (
                <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-pixel-yellow border-2 border-cocoa rounded text-[10px] font-pixel text-cocoa shadow-[1px_1px_0_0_#5A3E36]">
                    LV{level}
                </div>
            )}
        </div>
    );
}
