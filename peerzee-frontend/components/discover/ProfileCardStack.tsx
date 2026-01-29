'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Star, Heart, Loader2 } from 'lucide-react';
import ProfileCard from './ProfileCard';
import type { DiscoverUser } from '@/hooks/useDiscover';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa
  textMuted: '#5D4037',      // Medium Brown
  background: '#FFFFFF',      // Pure White
  border: '#4A3228',          // Dark Coffee
  pink: '#F4B0C8',            // Retro Pink
  green: '#98D689',           // Pixel Green
  blue: '#7EC8E3',            // Soft Blue
  yellow: '#FFE082',          // Soft Yellow
  red: '#E57373',             // Soft Red
} as const;

interface ProfileCardStackProps {
    users: DiscoverUser[];
    onSwipe: (userId: string, action: 'LIKE' | 'PASS' | 'SUPER_LIKE', contentId?: string, contentType?: 'photo' | 'prompt' | 'vibe') => void;
    onEmpty?: () => void;
    isLoading?: boolean;
}

const SWIPE_THRESHOLD = 100;

/**
 * ProfileCardStack - High Contrast Retro OS Style
 * Swipeable card stack with pixel borders and hard shadows
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
            <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center">
                <div 
                    className="w-20 h-20 border-[4px] flex items-center justify-center mb-4"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.pink }}
                >
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: COLORS.border }} />
                </div>
                <p 
                    className="font-pixel text-sm uppercase"
                    style={{ color: COLORS.text }}
                >
                    SEARCHING FOR ADVENTURERS...
                </p>
            </div>
        );
    }

    // Empty state - Retro OS style
    if (!currentUser) {
        return (
            <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center px-8">
                <div 
                    className="w-24 h-24 mb-6 border-[4px] flex items-center justify-center text-4xl"
                    style={{ borderColor: COLORS.border, backgroundColor: COLORS.yellow }}
                >
                    🏰
                </div>
                <h2 
                    className="font-pixel text-xl uppercase text-center mb-2"
                    style={{ color: COLORS.text }}
                >
                    QUEST COMPLETE!
                </h2>
                <p 
                    className="text-sm font-body text-center max-w-xs mb-6"
                    style={{ color: COLORS.textMuted }}
                >
                    You've met everyone nearby. Check back later for new adventurers!
                </p>
                {onEmpty && (
                    <button
                        onClick={onEmpty}
                        className="px-6 py-3 font-pixel text-sm uppercase border-[3px] transition-all hover:translate-y-[-2px]"
                        style={{ 
                            backgroundColor: COLORS.pink, 
                            borderColor: COLORS.border,
                            color: COLORS.border,
                            boxShadow: `4px 4px 0px ${COLORS.border}`
                        }}
                    >
                        🔄 REFRESH
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="relative h-[calc(100vh-200px)] w-full max-w-sm mx-auto">
            {/* Card Stack */}
            <div className="absolute inset-x-0 top-0 bottom-28">
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
                            className="absolute top-8 left-8 z-20 px-6 py-3 border-[4px] rotate-[-15deg]"
                            style={{ 
                                opacity: likeOpacity,
                                backgroundColor: COLORS.green,
                                borderColor: COLORS.border,
                                boxShadow: `4px 4px 0px ${COLORS.border}`
                            }}
                        >
                            <span 
                                className="font-pixel text-xl uppercase"
                                style={{ color: COLORS.border }}
                            >
                                LIKE!
                            </span>
                        </motion.div>

                        {/* Pass indicator */}
                        <motion.div
                            className="absolute top-8 right-8 z-20 px-6 py-3 border-[4px] rotate-[15deg]"
                            style={{ 
                                opacity: passOpacity,
                                backgroundColor: COLORS.red,
                                borderColor: COLORS.border,
                                boxShadow: `4px 4px 0px ${COLORS.border}`
                            }}
                        >
                            <span 
                                className="font-pixel text-xl uppercase"
                                style={{ color: COLORS.background }}
                            >
                                NOPE
                            </span>
                        </motion.div>

                        <ProfileCard user={currentUser} onContentClick={handleContentClick} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Action Buttons - Retro OS style */}
            <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                {/* Pass Button */}
                <button
                    onClick={() => handleButtonSwipe('PASS')}
                    className="w-16 h-16 border-[3px] flex items-center justify-center transition-all hover:translate-y-[-3px] active:translate-y-0"
                    style={{ 
                        backgroundColor: COLORS.background, 
                        borderColor: COLORS.border,
                        boxShadow: `4px 4px 0px ${COLORS.border}`
                    }}
                    aria-label="Pass"
                >
                    <X className="w-7 h-7" style={{ color: COLORS.red }} />
                </button>

                {/* Super Like */}
                <button
                    onClick={() => handleButtonSwipe('SUPER_LIKE')}
                    className="w-14 h-14 border-[3px] flex items-center justify-center transition-all hover:translate-y-[-3px] active:translate-y-0"
                    style={{ 
                        backgroundColor: COLORS.yellow, 
                        borderColor: COLORS.border,
                        boxShadow: `3px 3px 0px ${COLORS.border}`
                    }}
                    aria-label="Super Like"
                >
                    <Star className="w-6 h-6" style={{ color: COLORS.border }} />
                </button>

                {/* Like Button */}
                <button
                    onClick={() => handleButtonSwipe('LIKE')}
                    className="w-16 h-16 border-[3px] flex items-center justify-center transition-all hover:translate-y-[-3px] active:translate-y-0"
                    style={{ 
                        backgroundColor: COLORS.pink, 
                        borderColor: COLORS.border,
                        boxShadow: `4px 4px 0px ${COLORS.border}`
                    }}
                    aria-label="Like"
                >
                    <Heart className="w-7 h-7 fill-current" style={{ color: COLORS.border }} />
                </button>
            </div>

            {/* Selected content indicator */}
            {selectedContent && (
                <div 
                    className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 border-[2px] font-pixel text-xs uppercase"
                    style={{ 
                        backgroundColor: COLORS.green, 
                        borderColor: COLORS.border,
                        color: COLORS.border
                    }}
                >
                    ✨ LIKING: {selectedContent.type}
                </div>
            )}
        </div>
    );
}
