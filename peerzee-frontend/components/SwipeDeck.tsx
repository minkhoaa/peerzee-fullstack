'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Check, Star, Loader2, Heart, Sparkles } from 'lucide-react';
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

    // Empty state - ToyWorld styled
    if (!currentUser && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[75vh] px-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[40px] p-8 shadow-xl shadow-[#CD6E67]/15 border-2 border-[#ECC8CD]/40 text-center max-w-sm"
                >
                    <div className="text-6xl mb-4">🔍</div>
                    <h2 className="text-2xl font-nunito font-bold text-[#3E3229] mb-2">
                        No more people to discover
                    </h2>
                    <p className="text-[#7A6862] text-sm mb-6">
                        Check back later for new recommendations ✨
                    </p>
                    {onEmpty && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onEmpty}
                            className="px-8 py-3 bg-[#CD6E67] text-white font-bold rounded-full hover:bg-[#B85C55] transition-colors shadow-lg shadow-[#CD6E67]/30"
                        >
                            <Sparkles className="w-4 h-4 inline mr-2" />
                            Refresh
                        </motion.button>
                    )}
                </motion.div>
            </div>
        );
    }

    // Loading state - ToyWorld styled
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[75vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-[#ECC8CD] border-t-[#CD6E67] mb-4"
                />
                <p className="text-[#7A6862] text-sm font-medium">Finding people near you... 💕</p>
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
                            {/* Like Indicator - ToyWorld styled */}
                            <motion.div
                                style={{ opacity: likeOpacity }}
                                className="absolute top-8 left-8 z-20 bg-green-100 border-4 border-green-400 text-green-600 px-4 py-2 rounded-full font-bold text-xl rotate-[-15deg] shadow-lg"
                            >
                                💚 LIKE
                            </motion.div>

                            {/* Pass Indicator - ToyWorld styled */}
                            <motion.div
                                style={{ opacity: passOpacity }}
                                className="absolute top-8 right-8 z-20 bg-red-100 border-4 border-red-400 text-red-600 px-4 py-2 rounded-full font-bold text-xl rotate-[15deg] shadow-lg"
                            >
                                NOPE 👋
                            </motion.div>

                            <RichProfileCard user={currentUser} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Bar - ToyWorld styled */}
            <FloatingActionBar
                onPass={() => handleButtonSwipe('left')}
                onLike={() => handleButtonSwipe('right')}
                onSuperLike={onSuperLike ? handleSuperLike : undefined}
                disabled={!currentUser}
            />
        </div>
    );
}

// Floating Action Bar Component - ToyWorld styled
interface FloatingActionBarProps {
    onPass: () => void;
    onLike: () => void;
    onSuperLike?: () => void;
    disabled?: boolean;
}

function FloatingActionBar({ onPass, onLike, onSuperLike, disabled }: FloatingActionBarProps) {
    return (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-20">
            {/* Pass Button - ToyWorld styled */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPass}
                disabled={disabled}
                className="w-16 h-16 rounded-full border-4 border-[#ECC8CD] flex items-center justify-center 
                         text-[#7A6862] hover:border-red-400 hover:text-red-500 hover:bg-red-50
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                         bg-white shadow-xl shadow-[#CD6E67]/15"
                title="Pass"
            >
                <X className="w-7 h-7" strokeWidth={3} />
            </motion.button>

            {/* Super Like Button (Optional) - ToyWorld styled */}
            {onSuperLike && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onSuperLike}
                    disabled={disabled}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 border-4 border-yellow-300 
                             flex items-center justify-center text-white hover:from-yellow-500 hover:to-orange-500
                             transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                             shadow-xl shadow-yellow-400/30"
                    title="Super Like"
                >
                    <Star className="w-6 h-6" fill="white" />
                </motion.button>
            )}

            {/* Like Button - ToyWorld styled */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onLike}
                disabled={disabled}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CD6E67] to-[#E88B85] flex items-center justify-center 
                         text-white hover:from-[#B85C55] hover:to-[#CD6E67]
                         transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                         shadow-xl shadow-[#CD6E67]/40 border-4 border-white/50"
                title="Like"
            >
                <Heart className="w-7 h-7" fill="white" />
            </motion.button>
        </div>
    );
}
