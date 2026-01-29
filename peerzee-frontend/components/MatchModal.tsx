'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface MatchedUser {
    id: string;
    display_name: string;
}

interface MatchModalProps {
    isOpen: boolean;
    matchedUser: MatchedUser | null;
    conversationId: string | null;
    onClose: () => void;
}

/**
 * MatchModal - Retro Pixel OS styled match celebration modal
 */
export default function MatchModal({ isOpen, matchedUser, conversationId, onClose }: MatchModalProps) {
    const router = useRouter();

    const handleStartChatting = () => {
        if (conversationId) {
            router.push(`/chat?conversation=${conversationId}`);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && matchedUser && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg max-w-sm w-full mx-4"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center">
                            {/* Match icon */}
                            <motion.div
                                className="flex justify-center mb-6"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                            >
                                <div className="w-20 h-20 rounded-xl bg-pixel-pink border-3 border-cocoa shadow-pixel flex items-center justify-center">
                                    <svg className="w-10 h-10 text-cocoa fill-cocoa" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-2xl font-pixel uppercase tracking-widest text-cocoa mb-2">
                                    It&apos;s a Match!
                                </h2>
                                <p className="text-cocoa-light font-bold mb-6">
                                    You and <span className="font-bold text-cocoa">{matchedUser.display_name}</span> liked each other
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleStartChatting}
                                        className="w-full py-3 px-6 bg-pixel-pink text-cocoa font-pixel uppercase tracking-widest border-3 border-cocoa rounded-xl shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
                                    >
                                        Start Chatting
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 px-6 bg-retro-paper text-cocoa font-bold border-2 border-cocoa rounded-xl shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                    >
                                        Keep Swiping
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
