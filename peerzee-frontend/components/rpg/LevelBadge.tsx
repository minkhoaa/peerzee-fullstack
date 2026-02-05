'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crown, Star, Flame } from 'lucide-react';

interface LevelBadgeProps {
    level: number;
    xp: number;
    xpProgress: number;
    xpNeeded: number;
    progressPercent: number;
    currentStreak?: number;
    size?: 'sm' | 'md' | 'lg';
    showProgress?: boolean;
    showStreak?: boolean;
    animate?: boolean;
}

// Level tier colors and icons
const LEVEL_TIERS = [
    { minLevel: 1, maxLevel: 5, color: '#A8D5BA', name: 'Newbie', icon: Star },
    { minLevel: 6, maxLevel: 10, color: '#7EC8E3', name: 'Explorer', icon: Zap },
    { minLevel: 11, maxLevel: 15, color: '#DDA0DD', name: 'Adventurer', icon: Flame },
    { minLevel: 16, maxLevel: 20, color: '#FFD700', name: 'Champion', icon: Crown },
    { minLevel: 21, maxLevel: 99, color: '#FF6B6B', name: 'Legend', icon: Crown },
];

function getTier(level: number) {
    return LEVEL_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || LEVEL_TIERS[0];
}

export default function LevelBadge({
    level,
    xp,
    xpProgress,
    xpNeeded,
    progressPercent,
    currentStreak = 0,
    size = 'md',
    showProgress = true,
    showStreak = true,
    animate = true,
}: LevelBadgeProps) {
    const [isLevelingUp, setIsLevelingUp] = useState(false);
    const [prevLevel, setPrevLevel] = useState(level);
    const tier = getTier(level);
    const TierIcon = tier.icon;

    // Detect level up
    useEffect(() => {
        if (level > prevLevel) {
            setIsLevelingUp(true);
            const timer = setTimeout(() => setIsLevelingUp(false), 2000);
            setPrevLevel(level);
            return () => clearTimeout(timer);
        }
        setPrevLevel(level);
    }, [level, prevLevel]);

    const sizeClasses = {
        sm: { container: 'w-10 h-10', text: 'text-xs', ring: 2 },
        md: { container: 'w-14 h-14', text: 'text-sm', ring: 3 },
        lg: { container: 'w-20 h-20', text: 'text-lg', ring: 4 },
    };

    const currentSize = sizeClasses[size];
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            {/* Level Up Animation */}
            <AnimatePresence>
                {isLevelingUp && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 z-50"
                    >
                        <div className="px-3 py-1 bg-gradient-to-r from-pixel-pink to-pixel-purple text-white text-xs font-pixel rounded-full shadow-lg whitespace-nowrap">
                            ⬆️ Level Up!
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Badge Container */}
            <div className="relative">
                <motion.div
                    className={`relative ${currentSize.container} flex items-center justify-center`}
                    animate={isLevelingUp ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                    } : {}}
                    transition={{ duration: 0.5 }}
                >
                    {/* Progress Ring */}
                    {showProgress && (
                        <svg
                            className="absolute inset-0 -rotate-90"
                            viewBox="0 0 100 100"
                        >
                            {/* Background ring */}
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="#E5D5C5"
                                strokeWidth={currentSize.ring}
                            />
                            {/* Progress ring */}
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={tier.color}
                                strokeWidth={currentSize.ring}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: animate ? 1 : 0, ease: 'easeOut' }}
                            />
                        </svg>
                    )}

                    {/* Level Number */}
                    <div
                        className={`relative z-10 flex flex-col items-center justify-center rounded-full border-2 ${currentSize.container}`}
                        style={{
                            backgroundColor: `${tier.color}20`,
                            borderColor: tier.color,
                        }}
                    >
                        <TierIcon 
                            className="w-3 h-3 mb-0.5" 
                            style={{ color: tier.color }}
                        />
                        <span
                            className={`font-pixel font-bold ${currentSize.text}`}
                            style={{ color: tier.color }}
                        >
                            {level}
                        </span>
                    </div>
                </motion.div>

                {/* Streak Badge */}
                {showStreak && currentStreak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-pixel rounded-full shadow-md"
                    >
                        <Flame className="w-3 h-3" />
                        {currentStreak}
                    </motion.div>
                )}
            </div>

            {/* XP Text */}
            {showProgress && size !== 'sm' && (
                <div className="text-center">
                    <p className="text-[10px] text-cocoa-light font-medium">
                        {xpProgress} / {xpNeeded} XP
                    </p>
                    <p className="text-[9px] text-cocoa-light/70">
                        {tier.name}
                    </p>
                </div>
            )}
        </div>
    );
}

// Compact inline version for use in headers/lists
export function LevelBadgeInline({ 
    level, 
    className = '' 
}: { 
    level: number; 
    className?: string;
}) {
    const tier = getTier(level);

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-pixel rounded-full ${className}`}
            style={{
                backgroundColor: `${tier.color}20`,
                color: tier.color,
                border: `1px solid ${tier.color}`,
            }}
        >
            <tier.icon className="w-3 h-3" />
            Lv.{level}
        </span>
    );
}
