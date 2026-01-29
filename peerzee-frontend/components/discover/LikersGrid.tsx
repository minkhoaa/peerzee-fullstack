'use client';

import React from 'react';
import { Star, Lock, Award } from 'lucide-react';

interface Liker {
    id: string;
    display_name: string;
    avatar?: string;
    isSuperLike: boolean;
    likedAt: string;
    message?: string;
}

interface LikersGridProps {
    likers: Liker[];
    isPremium?: boolean;
    onReveal?: () => void;
}

/**
 * LikersGrid - Shows users who liked you with blurred avatars
 * Premium users can reveal, free users see blur effect
 */
export default function LikersGrid({ likers, isPremium = false, onReveal }: LikersGridProps) {
    if (likers.length === 0) {
        return (
            <div className="p-8 text-center bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel">
                <Star className="w-12 h-12 mx-auto text-cocoa-light mb-3" strokeWidth={2.5} />
                <p className="text-cocoa font-bold text-sm">No one has liked you yet</p>
                <p className="text-cocoa-light text-xs mt-1">Keep swiping to get noticed!</p>
            </div>
        );
    }

    return (
        <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b-3 border-cocoa flex items-center justify-between bg-pixel-pink/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pixel-pink border-2 border-cocoa rounded-lg shadow-pixel-sm">
                        <Star className="w-5 h-5 text-cocoa fill-cocoa" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h3 className="text-sm font-pixel uppercase tracking-widest text-cocoa">Who Liked You</h3>
                        <p className="text-xs text-cocoa-light font-bold">{likers.length} people</p>
                    </div>
                </div>
                {!isPremium && (
                    <button
                        onClick={onReveal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-pixel-yellow border-2 border-cocoa text-cocoa text-sm font-pixel uppercase tracking-wider rounded-lg shadow-pixel-sm hover:bg-pixel-yellow/80 transition-colors active:translate-y-0.5 active:shadow-none"
                    >
                        <Award className="w-4 h-4" strokeWidth={2.5} />
                        Reveal
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="p-4 grid grid-cols-3 gap-3 bg-retro-paper">
                {likers.map((liker) => (
                    <div
                        key={liker.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-retro-bg border-2 border-cocoa shadow-pixel-sm group"
                    >
                        {/* Avatar (blurred for non-premium) */}
                        <img
                            src={liker.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.id}`}
                            alt="Someone"
                            className={`w-full h-full object-cover transition-all ${isPremium ? '' : 'filter blur-[12px]'
                                }`}
                        />

                        {/* Super Like indicator */}
                        {liker.isSuperLike && (
                            <div className="absolute top-2 right-2 p-1 bg-pixel-blue border-2 border-cocoa rounded-md">
                                <Star className="w-3 h-3 text-cocoa fill-cocoa" />
                            </div>
                        )}

                        {/* Lock overlay for non-premium */}
                        {!isPremium && (
                            <div className="absolute inset-0 flex items-center justify-center bg-cocoa/30">
                                <div className="p-2 bg-retro-white border-2 border-cocoa rounded-lg">
                                    <Lock className="w-5 h-5 text-cocoa" />
                                </div>
                            </div>
                        )}

                        {/* Name (visible for premium) */}
                        {isPremium && (
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-cocoa/80">
                                <p className="text-xs text-retro-white font-bold truncate">
                                    {liker.display_name}
                                </p>
                            </div>
                        )}

                        {/* Message indicator */}
                        {liker.message && (
                            <div className="absolute bottom-2 left-2 w-2 h-2 bg-pixel-pink border border-cocoa rounded animate-pulse" />
                        )}
                    </div>
                ))}
            </div>

            {/* Premium Upsell */}
            {!isPremium && likers.length > 0 && (
                <div className="p-4 border-t-3 border-cocoa bg-pixel-yellow/20">
                    <p className="text-sm text-cocoa text-center mb-3 font-bold">
                        See who&apos;s interested in you
                    </p>
                    <button
                        onClick={onReveal}
                        className="w-full py-3 bg-pixel-yellow border-3 border-cocoa text-cocoa font-pixel uppercase tracking-widest rounded-lg shadow-pixel hover:bg-pixel-yellow/80 transition-colors flex items-center justify-center gap-2 active:translate-y-0.5 active:shadow-none"
                    >
                        <Award className="w-5 h-5" strokeWidth={2.5} />
                        Upgrade to Premium
                    </button>
                </div>
            )}
        </div>
    );
}
