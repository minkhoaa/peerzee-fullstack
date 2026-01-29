'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, MessageSquareText, Eye, RefreshCw, Star, PartyPopper } from 'lucide-react';
import { BlindDateState } from '@/hooks/useVideoDating';

interface BlindDateOverlayProps {
    blindDate: BlindDateState;
    onRequestTopic: () => void;
    onRequestReveal: () => void;
    onAcceptReveal: () => void;
}

export function BlindDateOverlay({
    blindDate,
    onRequestTopic,
    onRequestReveal,
    onAcceptReveal,
}: BlindDateOverlayProps) {
    const { introMessage, currentTopic, blurLevel, topicNumber, isRescue, revealRequested } = blindDate;

    return (
        <>
            {/* AI Host Welcome Message - Show briefly at start */}
            <AnimatePresence>
                {topicNumber === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-4 left-4 right-4 z-20"
                    >
                        <div className="bg-retro-white border-3 border-cocoa rounded-xl p-4 shadow-pixel">
                            <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-pixel-pink" strokeWidth={2.5} />
                                <span className="text-sm font-pixel font-medium text-cocoa">AI Host</span>
                            </div>
                            <p className="text-sm text-cocoa">{introMessage}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Topic Card - Bottom Center */}
            <motion.div
                key={currentTopic}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute bottom-24 left-4 right-4 z-20"
            >
                <div
                    className={`${isRescue
                        ? 'bg-pixel-yellow'
                        : 'bg-retro-white'
                        } border-3 border-cocoa rounded-xl p-4 shadow-pixel`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquareText className={`w-4 h-4 ${isRescue ? 'text-pixel-yellow' : 'text-pixel-blue'}`} strokeWidth={2.5} />
                            <span className="text-xs font-pixel font-medium text-cocoa-light">
                                Chủ đề #{topicNumber} {isRescue && 'Phao cứu sinh!'}
                            </span>
                        </div>
                        <button
                            onClick={onRequestTopic}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cocoa/10 hover:bg-cocoa/20 transition-colors border border-cocoa"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-cocoa-light" />
                            <span className="text-xs text-cocoa-light">Đổi</span>
                        </button>
                    </div>
                    <p className="text-base font-medium text-cocoa leading-relaxed">{currentTopic}</p>
                </div>
            </motion.div>

            {/* Blur Level Indicator */}
            <div className="absolute top-4 right-4 z-20">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl px-3 py-2 flex items-center gap-2 shadow-pixel-sm">
                    <Eye className="w-4 h-4 text-cocoa-light" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-pixel text-cocoa-light uppercase tracking-wider">Blur</span>
                        <div className="flex items-center gap-1">
                            <div className="w-16 h-2 bg-cocoa/20 rounded-full overflow-hidden border border-cocoa">
                                <motion.div
                                    className="h-full bg-pixel-pink"
                                    initial={false}
                                    animate={{ width: `${Math.max(0, 100 - (blurLevel / 20) * 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-xs font-mono text-cocoa">{blurLevel}px</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Early Reveal Button (when blur > 0) */}
            {blurLevel > 0 && (
                <div className="absolute top-16 right-4 z-20">
                    <button
                        onClick={onRequestReveal}
                        className="bg-pixel-pink/20 border-3 border-cocoa rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-pixel-pink/40 transition-all shadow-pixel-sm"
                    >
                        <Star className="w-4 h-4 text-pixel-pink" strokeWidth={2.5} />
                        <span className="text-xs font-pixel text-cocoa">Reveal sớm</span>
                    </button>
                </div>
            )}

            {/* Reveal Request Modal */}
            <AnimatePresence>
                {revealRequested && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-cocoa/60"
                    >
                        <div className="bg-retro-white border-3 border-cocoa rounded-xl p-6 max-w-xs text-center shadow-pixel">
                            <div className="w-16 h-16 rounded-full bg-pixel-pink border-3 border-cocoa flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-cocoa" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-pixel font-semibold text-cocoa mb-2">Đối phương muốn reveal!</h3>
                            <p className="text-sm text-cocoa-light mb-4">
                                Họ muốn thấy mặt bạn sớm hơn. Bạn có đồng ý không?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {/* Just close, don't accept */}}
                                    className="flex-1 py-2.5 rounded-xl bg-cocoa/10 border-3 border-cocoa text-cocoa-light text-sm hover:bg-cocoa/20 transition-colors"
                                >
                                    Từ từ đã
                                </button>
                                <button
                                    onClick={onAcceptReveal}
                                    className="flex-1 py-2.5 rounded-xl bg-pixel-pink border-3 border-cocoa text-cocoa text-sm font-pixel font-medium hover:opacity-90 transition-opacity shadow-pixel-sm"
                                >
                                    Đồng ý!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Reveal Celebration */}
            <AnimatePresence>
                {blurLevel === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.5, times: [0, 0.7, 1] }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-2 bg-pixel-yellow border-3 border-cocoa rounded-full flex items-center justify-center shadow-pixel">
                                <PartyPopper className="w-10 h-10 text-cocoa" strokeWidth={2.5} />
                            </div>
                            <p className="text-cocoa font-pixel font-bold text-lg mt-2 drop-shadow-lg">Đã reveal!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
