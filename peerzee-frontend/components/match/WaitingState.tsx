'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, X } from 'lucide-react';

interface WaitingStateProps {
    queuePosition: number;
    totalInQueue: number;
    onCancel: () => void;
}

/**
 * WaitingState - Displayed when user is in queue waiting for a match
 */
export function WaitingState({ queuePosition, totalInQueue, onCancel }: WaitingStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg p-8 max-w-md mx-auto text-center"
        >
            {/* Animated Loader */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6"
            >
                <div className="w-full h-full border-8 border-pixel-purple border-t-transparent rounded-full" />
            </motion.div>

            {/* Status */}
            <h3 className="font-pixel text-2xl text-cocoa uppercase tracking-wider mb-2">
                SEARCHING...
            </h3>

            <p className="text-cocoa-light font-bold mb-6">
                Waiting for compatible match
            </p>

            {/* Queue Info */}
            <div className="bg-pixel-blue/10 border-2 border-pixel-blue rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-pixel-blue" />
                    <span className="font-pixel text-sm text-cocoa uppercase">Queue Status</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <span className="font-pixel text-3xl text-pixel-blue">
                        #{queuePosition}
                    </span>
                    <span className="text-cocoa-light">/</span>
                    <span className="font-pixel text-xl text-cocoa-light">
                        {totalInQueue}
                    </span>
                </div>
                <p className="text-xs text-cocoa-light mt-1">
                    {totalInQueue === 1 ? 'You are the only one searching' : `${totalInQueue} people searching`}
                </p>
            </div>

            {/* Progress Animation */}
            <div className="mb-6">
                <div className="flex items-center justify-center gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-pixel-purple rounded-full"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Cancel Button */}
            <button
                onClick={onCancel}
                className="bg-retro-white border-3 border-cocoa rounded-lg px-6 py-3 font-pixel text-sm text-cocoa uppercase tracking-wider hover:bg-pixel-red/20 hover:border-pixel-red transition-all shadow-pixel active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 mx-auto"
            >
                <X className="w-4 h-4" />
                CANCEL SEARCH
            </button>

            {/* Tips */}
            <p className="text-xs text-cocoa-light mt-6">
                💡 Tip: You'll be notified when a compatible match is found!
            </p>
        </motion.div>
    );
}
