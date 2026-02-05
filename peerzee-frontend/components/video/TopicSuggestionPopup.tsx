'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, MessageCircle, Heart, Sparkles } from 'lucide-react';

export interface TopicSuggestion {
    topic: string;
    context: string;
    category: 'light' | 'deep' | 'playful' | 'romantic';
    emoji: string;
}

interface TopicSuggestionPopupProps {
    suggestions: TopicSuggestion[];
    silenceDuration: number;
    onDismiss: () => void;
    onSelectTopic?: (topic: string) => void;
}

const CATEGORY_COLORS = {
    light: 'bg-pixel-yellow border-pixel-yellow-dark text-cocoa',
    deep: 'bg-pixel-blue border-pixel-blue-dark text-white',
    playful: 'bg-pixel-pink border-pixel-pink-dark text-cocoa',
    romantic: 'bg-pixel-red border-pixel-red-dark text-white',
};

const CATEGORY_ICONS = {
    light: Lightbulb,
    deep: MessageCircle,
    playful: Sparkles,
    romantic: Heart,
};

/**
 * TopicSuggestionPopup - AI-generated conversation starters
 * 
 * Shows when conversation has been silent for >5 seconds
 * Suggests personalized topics based on profiles
 */
export default function TopicSuggestionPopup({
    suggestions,
    silenceDuration,
    onDismiss,
    onSelectTopic,
}: TopicSuggestionPopupProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleSelectTopic = (topic: string, index: number) => {
        setSelectedIndex(index);
        
        // Animate and dismiss
        setTimeout(() => {
            onSelectTopic?.(topic);
            onDismiss();
        }, 300);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-auto"
            >
                <div className="relative w-[500px] max-w-[90vw]">
                    {/* Card Container */}
                    <div className="bg-retro-white border-4 border-cocoa rounded-2xl shadow-pixel-xl p-6 relative">
                        {/* Close Button */}
                        <button
                            onClick={onDismiss}
                            className="absolute top-4 right-4 text-cocoa-light hover:text-cocoa transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-pixel-yellow rounded-xl border-3 border-cocoa flex items-center justify-center">
                                <Lightbulb className="w-6 h-6 text-cocoa" />
                            </div>
                            <div>
                                <h3 className="font-pixel text-cocoa text-lg">Conversation Starter</h3>
                                <p className="text-cocoa-light text-xs">
                                    {Math.round(silenceDuration / 1000)}s of silence detected
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-cocoa text-sm mb-4">
                            Need help breaking the ice? Try one of these topics! 💬
                        </p>

                        {/* Topic Suggestions */}
                        <div className="space-y-3">
                            {suggestions.map((suggestion, index) => {
                                const Icon = CATEGORY_ICONS[suggestion.category];
                                const isSelected = selectedIndex === index;

                                return (
                                    <motion.button
                                        key={index}
                                        onClick={() => handleSelectTopic(suggestion.topic, index)}
                                        className={`w-full text-left p-4 rounded-xl border-3 transition-all ${
                                            isSelected
                                                ? 'border-pixel-pink bg-pixel-pink/20 scale-95'
                                                : 'border-cocoa bg-white hover:bg-pixel-yellow/10 hover:border-pixel-yellow active:scale-95'
                                        }`}
                                        whileHover={!isSelected ? { scale: 1.02 } : {}}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Emoji */}
                                            <div className="text-3xl shrink-0 mt-1">
                                                {suggestion.emoji}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <p className="text-cocoa font-medium leading-relaxed">
                                                    {suggestion.topic}
                                                </p>
                                                <p className="text-cocoa-light text-xs mt-1">
                                                    {suggestion.context}
                                                </p>

                                                {/* Category Badge */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${
                                                        CATEGORY_COLORS[suggestion.category]
                                                    }`}>
                                                        <Icon className="w-3 h-3" />
                                                        <span className="text-[10px] font-pixel uppercase">
                                                            {suggestion.category}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="mt-4 p-3 bg-pixel-blue/10 border border-pixel-blue rounded-lg">
                            <p className="text-cocoa text-xs flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-pixel-blue" />
                                <span>
                                    Topics are personalized based on your profiles. Pick one or just say hi! 😊
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Glow Effect */}
                    <div className="absolute -inset-2 bg-gradient-to-r from-pixel-yellow via-pixel-pink to-pixel-blue rounded-2xl blur-xl opacity-20 -z-10" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
