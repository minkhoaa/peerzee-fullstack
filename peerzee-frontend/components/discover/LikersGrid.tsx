'use client';

import React from 'react';
import { Heart, Star, Lock, Sparkles } from 'lucide-react';

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
            <div className="p-8 text-center bg-[#202020] rounded-xl border border-[#2F2F2F]">
                <Heart className="w-12 h-12 mx-auto text-[#505050] mb-3" />
                <p className="text-[#9B9A97] text-sm">No one has liked you yet</p>
                <p className="text-[#505050] text-xs mt-1">Keep swiping to get noticed!</p>
            </div>
        );
    }

    return (
        <div className="bg-[#202020] rounded-xl border border-[#2F2F2F] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#2F2F2F] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-lg">
                        <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-[#E3E3E3]">Who Liked You</h3>
                        <p className="text-xs text-[#9B9A97]">{likers.length} people</p>
                    </div>
                </div>
                {!isPremium && (
                    <button
                        onClick={onReveal}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Reveal All
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
                {likers.map((liker) => (
                    <div
                        key={liker.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-[#191919] group"
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
                            <div className="absolute top-2 right-2 p-1.5 bg-blue-500 rounded-full">
                                <Star className="w-3 h-3 text-white fill-white" />
                            </div>
                        )}

                        {/* Lock overlay for non-premium */}
                        {!isPremium && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="p-3 bg-[#202020]/80 rounded-full">
                                    <Lock className="w-5 h-5 text-[#9B9A97]" />
                                </div>
                            </div>
                        )}

                        {/* Name (visible for premium) */}
                        {isPremium && (
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="text-xs text-white font-medium truncate">
                                    {liker.display_name}
                                </p>
                            </div>
                        )}

                        {/* Message indicator */}
                        {liker.message && (
                            <div className="absolute bottom-2 left-2 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
                        )}
                    </div>
                ))}
            </div>

            {/* Premium Upsell */}
            {!isPremium && likers.length > 0 && (
                <div className="p-4 border-t border-[#2F2F2F] bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <p className="text-sm text-[#E3E3E3] text-center mb-3">
                        See who&apos;s interested in you
                    </p>
                    <button
                        onClick={onReveal}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Sparkles className="w-5 h-5" />
                        Upgrade to Premium
                    </button>
                </div>
            )}
        </div>
    );
}
