'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle, Eye, RefreshCw, Heart } from 'lucide-react';
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
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-4 border border-purple-500/30">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                <span className="text-sm font-medium text-purple-300">AI Host</span>
                            </div>
                            <p className="text-sm text-white/90">{introMessage}</p>
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
                    className={`bg-gradient-to-br ${isRescue
                        ? 'from-orange-500/30 to-red-500/30 border-orange-500/50'
                        : 'from-blue-500/20 to-purple-500/20 border-blue-500/30'
                        } backdrop-blur-md rounded-2xl p-4 border`}
                    style={{
                        boxShadow: isRescue
                            ? '0 0 30px rgba(249, 115, 22, 0.3)'
                            : '0 0 30px rgba(139, 92, 246, 0.2)',
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageCircle className={`w-4 h-4 ${isRescue ? 'text-orange-400' : 'text-blue-400'}`} />
                            <span className="text-xs font-medium text-white/70">
                                Chủ đề #{topicNumber} {isRescue && '💡 Phao cứu sinh!'}
                            </span>
                        </div>
                        <button
                            onClick={onRequestTopic}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5 text-white/70" />
                            <span className="text-xs text-white/70">Đổi</span>
                        </button>
                    </div>
                    <p className="text-base font-medium text-white leading-relaxed">{currentTopic}</p>
                </div>
            </motion.div>

            {/* Blur Level Indicator */}
            <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-white/60" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/50 uppercase tracking-wider">Blur</span>
                        <div className="flex items-center gap-1">
                            <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                    initial={false}
                                    animate={{ width: `${Math.max(0, 100 - (blurLevel / 20) * 100)}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span className="text-xs font-mono text-white/80">{blurLevel}px</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Early Reveal Button (when blur > 0) */}
            {blurLevel > 0 && (
                <div className="absolute top-16 right-4 z-20">
                    <button
                        onClick={onRequestReveal}
                        className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-pink-500/30 rounded-xl px-3 py-2 flex items-center gap-2 hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
                    >
                        <Heart className="w-4 h-4 text-pink-400" />
                        <span className="text-xs text-white/80">Reveal sớm</span>
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
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <div className="bg-gradient-to-br from-purple-900/90 to-pink-900/90 rounded-2xl p-6 max-w-xs text-center border border-purple-500/30">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Đối phương muốn reveal!</h3>
                            <p className="text-sm text-white/70 mb-4">
                                Họ muốn thấy mặt bạn sớm hơn. Bạn có đồng ý không?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {/* Just close, don't accept */}}
                                    className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
                                >
                                    Từ từ đã
                                </button>
                                <button
                                    onClick={onAcceptReveal}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                >
                                    Đồng ý! 💕
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
                            <span className="text-6xl">🎉</span>
                            <p className="text-white font-bold text-lg mt-2 drop-shadow-lg">Đã reveal!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
