'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, X, Zap } from 'lucide-react';

interface PromptDeckProps {
    onSubmit: (query: string, interests: string[]) => void;
    isLoading?: boolean;
}

const INTEREST_CARTRIDGES = [
    'Code', 'Game', 'AI', 'Coffee', 'Travel',
    'Music', 'Anime', 'Sport', 'Art', 'Book'
];

const SAMPLE_QUERIES = [
    'Tìm bạn nam ở Hà Nội thích code và game',
    'Bạn nữ học AI tại Sài Gòn',
    'Người thích cafe và du lịch',
    'Developer yêu thích gaming và anime',
];

/**
 * PromptDeck - Natural language input interface
 * Styled as a code editor with interest "Data Cartridges"
 */
export function PromptDeck({ onSubmit, isLoading = false }: PromptDeckProps) {
    const [query, setQuery] = useState('');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim() && !isLoading) {
            onSubmit(query, selectedInterests);
        }
    };

    const toggleInterest = (interest: string) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleSampleClick = (sample: string) => {
        setQuery(sample);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg overflow-hidden max-w-2xl mx-auto"
        >
            {/* Header */}
            <div className="bg-pixel-purple border-b-3 border-cocoa px-4 py-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-cocoa" fill="currentColor" />
                    <span className="font-pixel text-sm text-cocoa uppercase tracking-wider">
                        AI MATCHMAKER PROMPT DECK
                    </span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                {/* Main Prompt Input */}
                <div className="mb-4">
                    <label className="block font-pixel text-xs text-cocoa-light uppercase tracking-wider mb-2">
                        Natural Language Query
                    </label>
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Describe your ideal match...&#10;e.g., 'Looking for a gamer in Hanoi who loves coffee and indie music'"
                        className="w-full h-32 bg-cocoa/5 border-2 border-cocoa rounded-lg px-4 py-3 font-mono text-sm text-cocoa placeholder:text-cocoa-light/50 focus:outline-none focus:border-pixel-pink focus:bg-cocoa/10 transition-all resize-none"
                        disabled={isLoading}
                    />
                </div>

                {/* Sample Queries */}
                <div className="mb-4">
                    <label className="block font-pixel text-xs text-cocoa-light uppercase tracking-wider mb-2">
                        Quick Samples
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SAMPLE_QUERIES.map((sample, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleSampleClick(sample)}
                                className="px-3 py-1.5 bg-pixel-blue/20 border border-cocoa text-cocoa text-xs font-bold rounded hover:bg-pixel-blue/40 transition-all"
                                disabled={isLoading}
                            >
                                {sample}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Interest Cartridges */}
                <div className="mb-6">
                    <label className="block font-pixel text-xs text-cocoa-light uppercase tracking-wider mb-2">
                        Data Cartridges (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {INTEREST_CARTRIDGES.map((interest) => (
                            <button
                                key={interest}
                                type="button"
                                onClick={() => toggleInterest(interest)}
                                className={`
                                    px-3 py-2 border-2 border-cocoa rounded-lg font-bold text-xs
                                    transition-all shadow-pixel-sm active:translate-y-0.5 active:shadow-none
                                    ${selectedInterests.includes(interest)
                                        ? 'bg-pixel-yellow text-cocoa'
                                        : 'bg-retro-white text-cocoa-light hover:bg-pixel-yellow/30'
                                    }
                                `}
                                disabled={isLoading}
                            >
                                {interest}
                                {selectedInterests.includes(interest) && (
                                    <X className="w-3 h-3 inline ml-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                        w-full bg-pixel-pink border-3 border-cocoa rounded-xl px-6 py-4
                        font-pixel text-lg text-cocoa uppercase tracking-wider
                        shadow-pixel transition-all
                        flex items-center justify-center gap-3
                        ${!query.trim() || isLoading
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-pixel-pink-dark active:translate-y-1 active:shadow-none'
                        }
                    `}
                >
                    {isLoading ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Zap className="w-6 h-6" />
                            </motion.div>
                            INITIALIZING...
                        </>
                    ) : (
                        <>
                            <Send className="w-6 h-6" />
                            RUN AGENT
                        </>
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
}
