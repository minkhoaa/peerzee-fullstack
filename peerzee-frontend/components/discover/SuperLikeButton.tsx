'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface SuperLikeButtonProps {
    onClick: () => void;
    disabled?: boolean;
    canSuperLike: boolean;
    nextResetAt?: Date;
}

/**
 * SuperLikeButton - Retro Pixel OS styled super like button
 * Star button with daily limit and tooltip
 */
export default function SuperLikeButton({
    onClick,
    disabled,
    canSuperLike,
    nextResetAt,
}: SuperLikeButtonProps) {
    const formatTimeRemaining = () => {
        if (!nextResetAt) return '';
        const now = new Date();
        const diff = nextResetAt.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={disabled || !canSuperLike}
                className={`
                    p-4 rounded-xl border-3 border-cocoa transition-all duration-200
                    ${canSuperLike
                        ? 'bg-pixel-blue shadow-pixel hover:translate-y-0.5 hover:shadow-none active:translate-y-1'
                        : 'bg-cocoa/20 cursor-not-allowed opacity-60'
                    }
                `}
            >
                <Star
                    className={`w-7 h-7 transition-transform ${canSuperLike
                            ? 'text-cocoa fill-cocoa group-hover:rotate-12'
                            : 'text-cocoa-light'
                        }`}
                />
            </button>

            {/* Tooltip */}
            {!canSuperLike && nextResetAt && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-retro-paper border-2 border-cocoa rounded-lg text-xs text-cocoa font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-pixel-sm">
                    Next super like in {formatTimeRemaining()}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-cocoa" />
                </div>
            )}

            {/* Available indicator */}
            {canSuperLike && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-pixel-green rounded-md border-2 border-cocoa" />
            )}
        </div>
    );
}
