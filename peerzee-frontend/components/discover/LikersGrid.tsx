'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, Lock, Sparkles, Crown } from 'lucide-react';

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
 * ToyWorld/Cozy Clay themed
 */
export default function LikersGrid({ likers, isPremium = false, onReveal }: LikersGridProps) {
    if (likers.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 text-center bg-white rounded-[30px] border-2 border-[#ECC8CD]/40 shadow-lg shadow-[#CD6E67]/10"
            >
                <div className="w-16 h-16 mx-auto bg-[#FDF0F1] rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-[#ECC8CD]" />
                </div>
                <p className="text-[#3E3229] font-nunito font-bold text-lg">No likes yet 💕</p>
                <p className="text-[#7A6862] text-sm mt-2">Keep swiping to get noticed!</p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[30px] border-2 border-[#ECC8CD]/40 overflow-hidden shadow-lg shadow-[#CD6E67]/10"
        >
            {/* Header */}
            <div className="p-5 border-b-2 border-[#ECC8CD]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#CD6E67]/20 to-[#E88B85]/20 rounded-full">
                        <Heart className="w-5 h-5 text-[#CD6E67] fill-[#CD6E67]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-nunito font-bold text-[#3E3229]">Who Liked You 💖</h3>
                        <p className="text-xs text-[#7A6862]">{likers.length} people</p>
                    </div>
                </div>
                {!isPremium && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onReveal}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-sm font-bold rounded-full hover:from-amber-500 hover:to-orange-500 transition-colors shadow-md shadow-orange-400/30"
                    >
                        <Sparkles className="w-4 h-4" />
                        Reveal All
                    </motion.button>
                )}
            </div>

            {/* Grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
                {likers.map((liker, index) => (
                    <motion.div
                        key={liker.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: isPremium ? 1.05 : 1 }}
                        className="relative aspect-square rounded-[20px] overflow-hidden bg-[#FDF0F1] border-2 border-[#ECC8CD]/40 group shadow-md"
                    >
                        {/* Avatar (blurred for non-premium) */}
                        <img
                            src={liker.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.id}`}
                            alt="Someone"
                            className={`w-full h-full object-cover transition-all ${isPremium ? '' : 'filter blur-[12px]'
                                }`}
                        />

                        {/* Super Like indicator - candy styled */}
                        {liker.isSuperLike && (
                            <div className="absolute top-2 right-2 p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-400/40 border-2 border-white/50">
                                <Star className="w-3 h-3 text-white fill-white" />
                            </div>
                        )}

                        {/* Lock overlay for non-premium - ToyWorld styled */}
                        {!isPremium && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[#ECC8CD]/40 backdrop-blur-sm">
                                <div className="p-4 bg-white/90 rounded-full shadow-lg border-2 border-[#ECC8CD]/40">
                                    <Lock className="w-5 h-5 text-[#CD6E67]" />
                                </div>
                            </div>
                        )}

                        {/* Name (visible for premium) */}
                        {isPremium && (
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-[#3E3229]/80 to-transparent">
                                <p className="text-xs text-white font-bold truncate">
                                    {liker.display_name}
                                </p>
                            </div>
                        )}

                        {/* Message indicator - pink bubble */}
                        {liker.message && (
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute bottom-3 left-3 w-3 h-3 bg-[#CD6E67] rounded-full border-2 border-white shadow-md" 
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Premium Upsell - ToyWorld styled */}
            {!isPremium && likers.length > 0 && (
                <div className="p-5 border-t-2 border-[#ECC8CD]/30 bg-gradient-to-r from-amber-50 to-orange-50">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <p className="text-sm font-bold text-[#3E3229]">
                            See who&apos;s interested in you! ✨
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onReveal}
                        className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold rounded-full hover:from-amber-500 hover:to-orange-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-400/30 border-b-4 border-orange-500/50"
                    >
                        <Sparkles className="w-5 h-5" />
                        Upgrade to Premium
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
}
