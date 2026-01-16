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
 * SuperLikeButton - Star button for super likes with daily limit
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
                    p-4 rounded-full transition-all duration-300 transform
                    ${canSuperLike
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 hover:scale-110 active:scale-95 shadow-lg shadow-blue-500/30'
                        : 'bg-[#2F2F2F] cursor-not-allowed opacity-60'
                    }
                `}
            >
                <Star
                    className={`w-7 h-7 transition-transform ${canSuperLike
                            ? 'text-white fill-white group-hover:rotate-12'
                            : 'text-[#9B9A97]'
                        }`}
                />
            </button>

            {/* Tooltip */}
            {!canSuperLike && nextResetAt && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#2F2F2F] rounded-lg text-xs text-[#E3E3E3] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Next super like in {formatTimeRemaining()}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2F2F2F]" />
                </div>
            )}

            {/* Available indicator */}
            {canSuperLike && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-[#191919]" />
            )}
        </div>
    );
}
