'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Check, Star, Loader2 } from 'lucide-react';
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
                <div className="text-6xl mb-6">🔍</div>
                <h2 className="text-2xl font-semibold text-[#E3E3E3] mb-2 text-center">
                    No more people to discover
                </h2>
                <p className="text-[#9B9A97] text-sm text-center mb-6">
                    Check back later for new recommendations
                </p>
                {onEmpty && (
                    <button
                        onClick={onEmpty}
                        className="px-6 py-3 bg-[#E3E3E3] text-[#191919] font-medium rounded-xl hover:bg-white transition-colors"
                    >
                        Refresh
                    </button>
                )}
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[75vh]">
                <Loader2 className="w-8 h-8 text-[#9B9A97] animate-spin" />
                <p className="text-[#9B9A97] text-sm mt-4">Finding people near you...</p>
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
                            {/* Like Indicator */}
                            <motion.div
                                style={{ opacity: likeOpacity }}
                                className="absolute top-8 left-8 z-20 border-4 border-green-400 text-green-400 px-4 py-2 rounded-lg font-bold text-xl rotate-[-15deg]"
                            >
                                LIKE
                            </motion.div>

                            {/* Pass Indicator */}
                            <motion.div
                                style={{ opacity: passOpacity }}
                                className="absolute top-8 right-8 z-20 border-4 border-red-400 text-red-400 px-4 py-2 rounded-lg font-bold text-xl rotate-[15deg]"
                            >
                                NOPE
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
            {/* Pass Button */}
            <button
                onClick={onPass}
                disabled={disabled}
                className="w-16 h-16 rounded-full border-2 border-[#E3E3E3] flex items-center justify-center 
                         text-[#E3E3E3] hover:border-red-400 hover:text-red-400 hover:scale-110
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                         bg-[#191919]/80 backdrop-blur-sm shadow-lg"
                title="Pass"
            >
                <X className="w-7 h-7" strokeWidth={2.5} />
            </button>

            {/* Super Like Button (Optional) */}
            {onSuperLike && (
                <button
                    onClick={onSuperLike}
                    disabled={disabled}
                    className="w-12 h-12 rounded-full bg-[#2F2F2F] border border-[#3A3A3A] flex items-center justify-center 
                             text-[#9B9A97] hover:text-yellow-400 hover:border-yellow-400 hover:scale-110
                             transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                             shadow-lg"
                    title="Super Like"
                >
                    <Star className="w-5 h-5" />
                </button>
            )}

            {/* Like Button */}
            <button
                onClick={onLike}
                disabled={disabled}
                className="w-16 h-16 rounded-full bg-[#E3E3E3] flex items-center justify-center 
                         text-[#191919] hover:bg-white hover:scale-110
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                         shadow-lg"
                title="Like"
            >
                <Check className="w-7 h-7" strokeWidth={2.5} />
            </button>
        </div>
    );
}
