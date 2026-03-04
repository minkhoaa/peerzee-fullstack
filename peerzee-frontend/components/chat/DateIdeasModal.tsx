'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle } from 'lucide-react';
import DateIdeaCard from './DateIdeaCard';
import type { DateIdeasResult } from '@/hooks/useWingman';

interface DateIdeasModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: DateIdeasResult | null;
    isLoading: boolean;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-16 bg-pixel-pink/30 rounded-xl border-2 border-cocoa/20" />
            {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-retro-white rounded-2xl border-2 border-cocoa/20" />
            ))}
            <div className="h-12 bg-pixel-blue/20 rounded-xl border-2 border-cocoa/20" />
        </div>
    );
}

export default function DateIdeasModal({ isOpen, onClose, data, isLoading }: DateIdeasModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-retro-paper border-3 border-cocoa rounded-2xl shadow-pixel-lg z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b-3 border-cocoa bg-pixel-pink/30 shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-cocoa" />
                                <h2 className="font-pixel text-cocoa text-sm uppercase tracking-widest">
                                    Date Ideas
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 text-cocoa hover:bg-pixel-red hover:text-white border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {isLoading ? (
                                <LoadingSkeleton />
                            ) : data ? (
                                <>
                                    {/* Host message */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-pixel-pink/20 border-2 border-cocoa/30 rounded-xl p-3"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="w-8 h-8 bg-pixel-pink border-2 border-cocoa rounded-lg flex items-center justify-center shrink-0">
                                                <Sparkles className="w-4 h-4 text-cocoa" />
                                            </div>
                                            <p className="text-cocoa text-sm leading-relaxed font-medium">
                                                {data.host_message}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Date idea cards */}
                                    {data.date_ideas.map((idea, i) => (
                                        <DateIdeaCard key={i} idea={idea} index={i} />
                                    ))}

                                    {/* Offline icebreaker */}
                                    {data.ice_breaker_offline && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="bg-pixel-blue/15 border-2 border-cocoa/30 rounded-xl p-3"
                                        >
                                            <div className="flex items-start gap-2">
                                                <MessageCircle className="w-4 h-4 text-cocoa mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-pixel text-cocoa uppercase tracking-wide mb-1">
                                                        Mở lời khi gặp mặt
                                                    </p>
                                                    <p className="text-cocoa text-sm leading-relaxed">
                                                        {data.ice_breaker_offline}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-cocoa-light py-8">
                                    <p className="font-pixel text-sm">Không thể tải gợi ý</p>
                                    <p className="text-xs mt-1">Thử lại sau nhé!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
