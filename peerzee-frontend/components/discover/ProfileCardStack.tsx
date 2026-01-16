'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';
import ProfileCard from './ProfileCard';
import type { DiscoverUser } from '@/hooks/useDiscover';

interface ProfileCardStackProps {
    users: DiscoverUser[];
    onSwipe: (userId: string, action: 'LIKE' | 'PASS' | 'SUPER_LIKE', contentId?: string, contentType?: 'photo' | 'prompt' | 'vibe') => void;
    onEmpty?: () => void;
    isLoading?: boolean;
}

const SWIPE_THRESHOLD = 100;

/**
 * ProfileCardStack - Swipeable card stack with Framer Motion
 * Strict Notion Dark theme styling
 */
export default function ProfileCardStack({ users, onSwipe, onEmpty, isLoading }: ProfileCardStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [selectedContent, setSelectedContent] = useState<{ id: string; type: 'photo' | 'prompt' | 'vibe' } | null>(null);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
    const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

    // Like/Pass indicators
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, 0], [1, 0]);

    const currentUser = users[currentIndex];
    const nextUser = users[currentIndex + 1];

    const handleDragEnd = useCallback(
        (_: unknown, info: PanInfo) => {
            const offset = info.offset.x;
            const velocity = info.velocity.x;

            if (offset > SWIPE_THRESHOLD || velocity > 500) {
                // Swipe right = LIKE
                setDirection('right');
                setTimeout(() => {
                    onSwipe(currentUser.id, 'LIKE', selectedContent?.id, selectedContent?.type);
                    setCurrentIndex((prev) => prev + 1);
                    setDirection(null);
                    setSelectedContent(null);
                }, 200);
            } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
                // Swipe left = PASS
                setDirection('left');
                setTimeout(() => {
                    onSwipe(currentUser.id, 'PASS');
                    setCurrentIndex((prev) => prev + 1);
                    setDirection(null);
                    setSelectedContent(null);
                }, 200);
            }
        },
        [currentUser, onSwipe, selectedContent],
    );

    const handleButtonSwipe = useCallback(
        (action: 'LIKE' | 'PASS' | 'SUPER_LIKE') => {
            if (!currentUser) return;
            setDirection(action === 'PASS' ? 'left' : 'right');
            setTimeout(() => {
                onSwipe(currentUser.id, action, selectedContent?.id, selectedContent?.type);
                setCurrentIndex((prev) => prev + 1);
                setDirection(null);
                setSelectedContent(null);
            }, 200);
        },
        [currentUser, onSwipe, selectedContent],
    );

    const handleContentClick = (contentId: string, contentType: 'photo' | 'prompt' | 'vibe') => {
        setSelectedContent({ id: contentId, type: contentType });
    };

    // Loading state
    if (isLoading && users.length === 0) {
        return (
            <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-[#2F2F2F] border-t-[#E3E3E3] rounded-full animate-spin" />
                <p className="mt-4 text-sm text-[#9B9A97]">Finding people nearby...</p>
            </div>
        );
    }

    // Empty state - Notion-style empty page
    if (!currentUser) {
        return (
            <div className="h-[calc(100vh-120px)] flex flex-col items-center justify-center px-8">
                <div className="w-16 h-16 mb-6 rounded-xl bg-[#202020] border border-[#2F2F2F] flex items-center justify-center">
                    <Heart className="w-8 h-8 text-[#9B9A97]" />
                </div>
                <h2 className="text-xl font-medium text-[#E3E3E3] text-center mb-2">
                    No more profiles
                </h2>
                <p className="text-sm text-[#9B9A97] text-center max-w-xs mb-6">
                    You've seen everyone nearby. Check back later for new people.
                </p>
                {onEmpty && (
                    <button
                        onClick={onEmpty}
                        className="px-6 py-3 text-sm font-medium bg-[#202020] text-[#E3E3E3] rounded-lg border border-[#2F2F2F] hover:border-[#505050] transition-colors"
                    >
                        Refresh
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative h-[calc(100vh-120px)] w-full max-w-md mx-auto">
            {/* Card Stack */}
            <div className="absolute inset-x-4 top-0 bottom-20">
                {/* Next card (behind) */}
                {nextUser && (
                    <div className="absolute inset-0 scale-[0.95] opacity-50">
                        <ProfileCard user={nextUser} />
                    </div>
                )}

                {/* Current card (front) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentUser.id}
                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                        style={{ x, rotate, opacity }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.8}
                        onDragEnd={handleDragEnd}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            x: direction === 'left' ? -500 : direction === 'right' ? 500 : 0,
                        }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        {/* Like indicator */}
                        <motion.div
                            className="absolute top-8 left-8 z-20 px-4 py-2 border-2 border-green-400 rounded-lg rotate-[-15deg]"
                            style={{ opacity: likeOpacity }}
                        >
                            <span className="text-lg font-bold text-green-400">LIKE</span>
                        </motion.div>

                        {/* Pass indicator */}
                        <motion.div
                            className="absolute top-8 right-8 z-20 px-4 py-2 border-2 border-red-400 rounded-lg rotate-[15deg]"
                            style={{ opacity: passOpacity }}
                        >
                            <span className="text-lg font-bold text-red-400">NOPE</span>
                        </motion.div>

                        <ProfileCard user={currentUser} onContentClick={handleContentClick} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Action Buttons - Minimalist circles */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-6">
                {/* Pass Button - Border only */}
                <button
                    onClick={() => handleButtonSwipe('PASS')}
                    className="w-14 h-14 rounded-full border-2 border-[#2F2F2F] bg-transparent flex items-center justify-center hover:border-red-400 hover:text-red-400 text-[#9B9A97] transition-colors"
                    aria-label="Pass"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Super Like - Border with star */}
                <button
                    onClick={() => handleButtonSwipe('SUPER_LIKE')}
                    className="w-12 h-12 rounded-full border-2 border-[#2F2F2F] bg-transparent flex items-center justify-center hover:border-blue-400 hover:text-blue-400 text-[#9B9A97] transition-colors"
                    aria-label="Super Like"
                >
                    <Star className="w-5 h-5" />
                </button>

                {/* Like Button - White bg, Black icon */}
                <button
                    onClick={() => handleButtonSwipe('LIKE')}
                    className="w-14 h-14 rounded-full bg-[#E3E3E3] flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Like"
                >
                    <Heart className="w-6 h-6 text-[#191919] fill-[#191919]" />
                </button>
            </div>

            {/* Selected content indicator */}
            {selectedContent && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#191919] border border-[#2F2F2F] rounded-full text-xs text-[#9B9A97]">
                    Liking: {selectedContent.type}
                </div>
            )}
        </div>
    );
}
