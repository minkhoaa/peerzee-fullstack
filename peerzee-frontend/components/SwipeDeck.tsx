'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Check, Award, Loader2 } from 'lucide-react';
import RichProfileCard, { type UserProfile } from './RichProfileCard';

interface SwipeDeckProps {
    users: UserProfile[];
    onSwipe: (userId: string, direction: 'left' | 'right') => void;
    onSuperLike?: (userId: string) => void;
    onEmpty?: () => void;
    isLoading?: boolean;
}

// Swipe thresholds
const SWIPE_THRESHOLD = 100;
const SWIPE_EXIT_VELOCITY = 800;

export default function SwipeDeck({
    users,
    onSwipe,
    onSuperLike,
    onEmpty,
    isLoading = false,
}: SwipeDeckProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [exitX, setExitX] = useState(0);

    // Motion values for drag
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
    const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);

    // Like/Pass indicator opacity
    const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
    const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

    const currentUser = users[currentIndex];
    const nextUser = users[currentIndex + 1];

    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const swipeThreshold = SWIPE_THRESHOLD;
            const velocityThreshold = SWIPE_EXIT_VELOCITY;

            if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                // Swipe Right = Like
                setExitX(300);
                onSwipe(currentUser.id, 'right');
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                    setExitX(0);
                }, 200);
            } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                // Swipe Left = Pass
                setExitX(-300);
                onSwipe(currentUser.id, 'left');
                setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                    setExitX(0);
                }, 200);
            }
        },
        [currentUser, onSwipe]
    );

    const handleButtonSwipe = useCallback(
        (direction: 'left' | 'right') => {
            if (!currentUser) return;
            setExitX(direction === 'right' ? 300 : -300);
            onSwipe(currentUser.id, direction);
            setTimeout(() => {
                setCurrentIndex((prev) => prev + 1);
                setExitX(0);
            }, 200);
        },
        [currentUser, onSwipe]
    );

    const handleSuperLike = useCallback(() => {
        if (!currentUser || !onSuperLike) return;
        onSuperLike(currentUser.id);
        setExitX(0);
        // Could animate upward for super like
        setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 200);
    }, [currentUser, onSuperLike]);

    // Empty state
    if (!currentUser && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[75vh] px-6">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-8 text-center">
                    <div className="text-6xl mb-6">🔍</div>
                    <h2 className="font-pixel text-2xl text-cocoa uppercase tracking-widest mb-2">
                        NO MORE PLAYERS
                    </h2>
                    <p className="font-body text-cocoa-light font-bold text-sm mb-6">
                        Check back later for new recommendations
                    </p>
                    {onEmpty && (
                        <button
                            onClick={onEmpty}
                            className="px-6 py-3 bg-pixel-pink text-cocoa font-pixel uppercase tracking-widest rounded-lg border-3 border-cocoa shadow-pixel hover:bg-pixel-pink-dark hover:translate-y-[-2px] hover:shadow-pixel-lg active:translate-y-1 active:shadow-none transition-all"
                        >
                            🔄 REFRESH
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[75vh]">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-8 text-center">
                    <div className="text-4xl mb-4 animate-pixel-bounce">⏳</div>
                    <p className="font-pixel text-cocoa uppercase tracking-widest">LOADING...</p>
                    <p className="font-body text-cocoa-light font-bold text-sm mt-2">Finding people near you</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[calc(75vh+80px)]">
            {/* Card Stack */}
            <div className="relative h-[75vh]">
                <AnimatePresence mode="popLayout">
                    {/* Next Card (Background) */}
                    {nextUser && (
                        <motion.div
                            key={nextUser.id + '-next'}
                            initial={{ scale: 0.95, opacity: 0.5 }}
                            animate={{ scale: 0.95, opacity: 0.7 }}
                            className="absolute inset-x-4 top-2"
                        >
                            <RichProfileCard user={nextUser} />
                        </motion.div>
                    )}

                    {/* Current Card (Draggable) */}
                    {currentUser && (
                        <motion.div
                            key={currentUser.id}
                            style={{ x, rotate, opacity }}
                            drag="x"
                            dragDirectionLock
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.9}
                            onDragEnd={handleDragEnd}
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
                            className="absolute inset-x-0 top-0 cursor-grab active:cursor-grabbing z-10"
                        >
                            {/* Like Indicator - Retro Style */}
                            <motion.div
                                style={{ opacity: likeOpacity }}
                                className="absolute top-8 left-8 z-20 bg-pixel-green border-3 border-cocoa text-cocoa px-4 py-2 rounded-lg font-pixel text-xl uppercase tracking-widest shadow-pixel rotate-[-15deg]"
                            >
                                ❤️ LIKE
                            </motion.div>

                            {/* Pass Indicator - Retro Style */}
                            <motion.div
                                style={{ opacity: passOpacity }}
                                className="absolute top-8 right-8 z-20 bg-pixel-red border-3 border-cocoa text-white px-4 py-2 rounded-lg font-pixel text-xl uppercase tracking-widest shadow-pixel rotate-[15deg]"
                            >
                                ✕ NOPE
                            </motion.div>

                            <RichProfileCard user={currentUser} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Bar */}
            <FloatingActionBar
                onPass={() => handleButtonSwipe('left')}
                onLike={() => handleButtonSwipe('right')}
                onSuperLike={onSuperLike ? handleSuperLike : undefined}
                disabled={!currentUser}
            />
        </div>
    );
}

// Floating Action Bar Component
interface FloatingActionBarProps {
    onPass: () => void;
    onLike: () => void;
    onSuperLike?: () => void;
    disabled?: boolean;
}

function FloatingActionBar({ onPass, onLike, onSuperLike, disabled }: FloatingActionBarProps) {
    return (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-20">
            {/* Pass Button - Retro Style */}
            <button
                onClick={onPass}
                disabled={disabled}
                className="w-16 h-16 rounded-xl border-3 border-cocoa flex items-center justify-center 
                         bg-retro-white text-cocoa hover:bg-pixel-red hover:text-white
                         shadow-pixel hover:translate-y-[-2px] hover:shadow-pixel-lg
                         active:translate-y-1 active:shadow-none
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Pass"
            >
                <X className="w-7 h-7" strokeWidth={3} />
            </button>

            {/* Super Like Button (Optional) - Retro Style */}
            {onSuperLike && (
                <button
                    onClick={onSuperLike}
                    disabled={disabled}
                    className="w-12 h-12 rounded-xl bg-pixel-yellow border-3 border-cocoa flex items-center justify-center 
                             text-cocoa hover:bg-pixel-purple
                             shadow-pixel-sm hover:translate-y-[-2px] hover:shadow-pixel
                             active:translate-y-1 active:shadow-none
                             transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Super Like"
                >
                    <Award className="w-5 h-5" strokeWidth={2.5} />
                </button>
            )}

            {/* Like Button - Retro Style */}
            <button
                onClick={onLike}
                disabled={disabled}
                className="w-16 h-16 rounded-xl bg-pixel-pink border-3 border-cocoa flex items-center justify-center 
                         text-cocoa hover:bg-pixel-green
                         shadow-pixel hover:translate-y-[-2px] hover:shadow-pixel-lg
                         active:translate-y-1 active:shadow-none
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Like"
            >
                <Check className="w-7 h-7" strokeWidth={3} />
            </button>
        </div>
    );
}
