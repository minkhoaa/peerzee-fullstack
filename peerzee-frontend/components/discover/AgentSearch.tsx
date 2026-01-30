'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, User, MapPin, Send, X, Terminal, ChevronRight, Loader2, Gamepad2, AlertCircle, Frown } from 'lucide-react';
import { useMatchAgent } from '@/hooks/useMatchAgent';
import { getAssetUrl } from '@/lib/api';

interface AgentSearchProps {
    onMatchClick?: (userId: string) => void;
    onClose?: () => void;
}

/**
 * RAG Matchmaker Agent Search Component
 * Terminal-style UI with progress steps
 */
export default function AgentSearch({ onMatchClick, onClose }: AgentSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');
    const { loading, error, result, steps, runAgent, reset } = useMatchAgent();

    const sampleQueries = [
        'Tìm bạn nam ở HN thích code',
        'Bạn nữ học AI Sài Gòn',
        'Người thích cafe và du lịch',
        'Developer thích gaming',
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;
        await runAgent(query);
    };

    const handleSampleClick = (sample: string) => {
        setQuery(sample);
        inputRef.current?.focus();
    };

    const handleNewSearch = () => {
        reset();
        setQuery('');
        inputRef.current?.focus();
    };

    return (
        <div className="bg-cocoa border-4 border-wood-shadow rounded-xl shadow-pixel-lg overflow-hidden">
            {/* Header */}
            <div className="bg-wood-dark px-4 py-3 flex items-center justify-between border-b-3 border-wood-shadow">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-pixel-green" />
                    <span className="font-pixel text-parchment uppercase tracking-wider text-sm">
                        RAG MATCHMAKER
                    </span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 text-parchment/60 hover:text-pixel-red transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Terminal Content */}
            <div className="p-4 font-mono text-sm min-h-[200px] max-h-[400px] overflow-y-auto">
                {/* Welcome Message */}
                {!result && steps.length === 0 && !loading && (
                    <div className="space-y-3">
                        <p className="text-pixel-green flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-pixel-yellow" />
                            <span>Xin chào! Tôi là Oracle - AI Matchmaker.</span>
                        </p>
                        <p className="text-parchment/80">
                            Mô tả người bạn muốn tìm bằng ngôn ngữ tự nhiên.
                        </p>
                        <p className="text-parchment/60 text-xs">Ví dụ:</p>
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((sample, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSampleClick(sample)}
                                    className="px-2 py-1 bg-wood-medium border border-wood-shadow text-parchment/80 text-xs rounded hover:bg-wood-light hover:text-pixel-orange transition-all"
                                >
                                    {sample}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <AnimatePresence mode="popLayout">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 py-1"
                        >
                            <ChevronRight className="w-3 h-3 text-pixel-green" />
                            <span className={`${step.includes('ERROR') || step.includes('FAILED') ? 'text-pixel-red' : 'text-pixel-green'}`}>
                                {step}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 py-2"
                    >
                        <Loader2 className="w-4 h-4 text-pixel-yellow animate-spin" />
                        <span className="text-pixel-yellow animate-pulse">Processing...</span>
                    </motion.div>
                )}

                {/* Result Card */}
                {result?.match && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 bg-retro-white border-3 border-pixel-green rounded-lg p-4 text-cocoa"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-pixel-yellow" />
                            <span className="font-pixel text-xs uppercase tracking-wider">BEST MATCH FOUND</span>
                        </div>

                        <div className="flex gap-3">
                            {/* Avatar placeholder */}
                            <div className="w-16 h-16 bg-retro-bg border-2 border-cocoa rounded-lg flex items-center justify-center shrink-0">
                                <User className="w-8 h-8 text-cocoa-light" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-body font-bold text-lg truncate">
                                    {result.match.profile.display_name}
                                </h4>
                                {result.match.profile.occupation && (
                                    <p className="text-cocoa-light text-sm font-bold truncate">
                                        {result.match.profile.occupation}
                                    </p>
                                )}
                                {result.match.profile.matchScore && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="font-pixel text-xs px-2 py-0.5 bg-pixel-green border border-cocoa rounded text-cocoa">
                                            {result.match.profile.matchScore}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {result.match.profile.tags && result.match.profile.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                                {result.match.profile.tags.slice(0, 5).map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 bg-pixel-blue border border-cocoa text-cocoa text-xs font-body font-bold rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* AI Reasoning */}
                        <div className="mt-3 p-3 bg-pixel-yellow/20 border-2 border-dashed border-cocoa/50 rounded-lg">
                            <div className="flex items-start gap-2">
                                <Bot className="w-4 h-4 text-cocoa shrink-0 mt-0.5" />
                                <p className="text-sm font-body font-bold text-cocoa leading-relaxed">
                                    {result.match.reasoning}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => onMatchClick?.(result.match!.profile.id)}
                                className="flex-1 py-2 bg-pixel-pink border-2 border-cocoa rounded-lg font-pixel text-sm uppercase tracking-wider text-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                Xem Profile
                            </button>
                            <button
                                onClick={handleNewSearch}
                                className="px-4 py-2 bg-retro-bg border-2 border-cocoa rounded-lg font-pixel text-sm uppercase tracking-wider text-cocoa shadow-pixel-sm hover:bg-retro-paper active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                Tìm mới
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* No Match */}
                {result && !result.match && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-4 p-4 bg-pixel-red/20 border-2 border-pixel-red rounded-lg text-parchment"
                    >
                        <p className="font-pixel text-sm flex items-center gap-2">
                            <Frown className="w-4 h-4" />
                            Không tìm thấy ai phù hợp.
                        </p>
                        <p className="text-xs mt-1 text-parchment/60">Thử mô tả khác hoặc mở rộng tiêu chí tìm kiếm.</p>
                        <button
                            onClick={handleNewSearch}
                            className="mt-3 px-4 py-2 bg-pixel-yellow border-2 border-cocoa rounded-lg font-pixel text-sm uppercase text-cocoa"
                        >
                            Thử lại
                        </button>
                    </motion.div>
                )}

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-2 text-pixel-red text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="border-t-3 border-wood-shadow bg-wood-dark p-3">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pixel-green" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Mô tả người bạn muốn tìm..."
                            disabled={loading}
                            className="w-full pl-7 pr-4 py-2.5 bg-cocoa border-2 border-wood-shadow rounded-lg font-mono text-sm text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-pixel-green disabled:opacity-50 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-4 py-2 bg-pixel-green border-2 border-wood-shadow rounded-lg text-cocoa font-pixel text-sm uppercase tracking-wider shadow-pixel-sm hover:bg-pixel-green/80 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
