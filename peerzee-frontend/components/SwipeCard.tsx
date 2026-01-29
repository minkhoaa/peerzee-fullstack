'use client';

import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

export interface SwipeCardUser {
    id: string;
    display_name: string;
    bio?: string;
    location?: string;
}

interface SwipeCardProps {
    user: SwipeCardUser;
    onSwipe: (direction: 'left' | 'right') => void;
    isTop: boolean;
}

/**
 * SwipeCard - Retro Pixel OS styled swipeable card
 */
export default function SwipeCard({ user, onSwipe, isTop }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

    // LIKE/PASS indicator opacity
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, 0], [1, 0]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            onSwipe('right');
        } else if (info.offset.x < -threshold) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            className={`absolute w-full max-w-sm bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden cursor-grab active:cursor-grabbing ${isTop ? 'z-10' : 'z-0'
                }`}
            style={{
                x: isTop ? x : 0,
                rotate: isTop ? rotate : 0,
                opacity: isTop ? opacity : 0.7,
                scale: isTop ? 1 : 0.95,
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.9}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
            exit={{
                x: x.get() > 0 ? 300 : -300,
                opacity: 0,
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            {/* LIKE indicator */}
            <motion.div
                className="absolute top-8 left-6 z-20 border-3 border-cocoa bg-pixel-green text-cocoa px-4 py-2 rounded-xl font-pixel uppercase tracking-widest text-sm rotate-[-20deg] shadow-pixel"
                style={{ opacity: likeOpacity }}
            >
                LIKE
            </motion.div>

            {/* PASS indicator */}
            <motion.div
                className="absolute top-8 right-6 z-20 border-3 border-cocoa bg-pixel-red text-cocoa px-4 py-2 rounded-xl font-pixel uppercase tracking-widest text-sm rotate-[20deg] shadow-pixel"
                style={{ opacity: passOpacity }}
            >
                PASS
            </motion.div>

            {/* User avatar placeholder */}
            <div className="h-64 bg-pixel-pink flex items-center justify-center">
                <span className="text-cocoa text-7xl font-pixel">
                    {user.display_name.charAt(0).toUpperCase()}
                </span>
            </div>

            {/* User info */}
            <div className="p-6">
                <h2 className="text-xl font-pixel uppercase tracking-widest text-cocoa mb-2">
                    {user.display_name}
                </h2>
                {user.location && (
                    <p className="text-cocoa-light flex items-center gap-1 mb-3 text-sm font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {user.location}
                    </p>
                )}
                {user.bio && (
                    <p className="text-cocoa text-sm font-medium line-clamp-3">
                        {user.bio}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
