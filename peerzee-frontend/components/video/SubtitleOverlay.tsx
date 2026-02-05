'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, X } from 'lucide-react';

export interface SubtitleData {
    text: string;
    originalText?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    timestamp?: number;
}

interface SubtitleOverlayProps {
    subtitle: SubtitleData | null;
    onToggleTranslation: () => void;
    isTranslationEnabled: boolean;
    sourceLanguage: string;
    targetLanguage: string;
    onLanguageChange: (source: string, target: string) => void;
}

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'id', name: 'Bahasa', flag: '🇮🇩' },
];

/**
 * SubtitleOverlay - Real-time translation subtitles for video calls
 * 
 * Features:
 * - Display translated subtitles at bottom of video
 * - Auto-hide after 5 seconds
 * - Show original text on hover
 * - Language selector
 * - Toggle translation on/off
 */
export default function SubtitleOverlay({
    subtitle,
    onToggleTranslation,
    isTranslationEnabled,
    sourceLanguage,
    targetLanguage,
    onLanguageChange,
}: SubtitleOverlayProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [showOriginal, setShowOriginal] = useState(false);

    // Auto-hide subtitle after 5 seconds
    useEffect(() => {
        if (!subtitle) return;

        const timer = setTimeout(() => {
            // Subtitle will be cleared by parent component
        }, 5000);

        return () => clearTimeout(timer);
    }, [subtitle]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Translation Controls - Top Right */}
            <div className="absolute top-4 right-4 pointer-events-auto">
                <motion.button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border-2 transition-all ${
                        isTranslationEnabled
                            ? 'bg-pixel-pink/90 border-cocoa text-cocoa'
                            : 'bg-black/50 border-white/30 text-white'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Languages className="w-5 h-5" />
                    <span className="font-pixel text-sm">
                        {isTranslationEnabled ? 'ON' : 'OFF'}
                    </span>
                </motion.button>

                {/* Language Settings Dropdown */}
                <AnimatePresence>
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-14 right-0 w-80 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg p-4 z-50"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-pixel text-cocoa text-sm">Translation Settings</h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="text-cocoa-light hover:text-cocoa"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Toggle Translation */}
                            <div className="mb-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isTranslationEnabled}
                                        onChange={onToggleTranslation}
                                        className="w-5 h-5 rounded border-2 border-cocoa accent-pixel-pink"
                                    />
                                    <span className="text-cocoa text-sm">Enable Real-time Translation</span>
                                </label>
                            </div>

                            {isTranslationEnabled && (
                                <>
                                    {/* Source Language */}
                                    <div className="mb-3">
                                        <label className="block text-cocoa text-xs mb-2 font-pixel">
                                            My Language
                                        </label>
                                        <select
                                            value={sourceLanguage}
                                            onChange={(e) => onLanguageChange(e.target.value, targetLanguage)}
                                            className="w-full px-3 py-2 bg-white border-2 border-cocoa rounded-lg text-cocoa text-sm focus:outline-none focus:border-pixel-pink"
                                        >
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Target Language */}
                                    <div>
                                        <label className="block text-cocoa text-xs mb-2 font-pixel">
                                            Their Language
                                        </label>
                                        <select
                                            value={targetLanguage}
                                            onChange={(e) => onLanguageChange(sourceLanguage, e.target.value)}
                                            className="w-full px-3 py-2 bg-white border-2 border-cocoa rounded-lg text-cocoa text-sm focus:outline-none focus:border-pixel-pink"
                                        >
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.flag} {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="mt-4 p-3 bg-pixel-yellow/20 border border-pixel-yellow rounded-lg">
                                <p className="text-cocoa text-xs">
                                    💡 Subtitles will appear at the bottom when your partner speaks.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Subtitle Display - Bottom Center */}
            <AnimatePresence>
                {subtitle && isTranslationEnabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto"
                        onMouseEnter={() => setShowOriginal(true)}
                        onMouseLeave={() => setShowOriginal(false)}
                    >
                        <div className="bg-black/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/20 max-w-2xl">
                            {/* Translated Text */}
                            <p className="text-white text-lg font-medium text-center leading-relaxed">
                                {subtitle.text}
                            </p>

                            {/* Original Text (show on hover) */}
                            <AnimatePresence>
                                {showOriginal && subtitle.originalText && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-white/60 text-sm text-center mt-2 pt-2 border-t border-white/20"
                                    >
                                        {subtitle.originalText}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            {/* Language Badge */}
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className="text-white/40 text-xs font-pixel">
                                    {SUPPORTED_LANGUAGES.find(l => l.code === subtitle.sourceLanguage)?.flag || '🌐'}
                                    {' → '}
                                    {SUPPORTED_LANGUAGES.find(l => l.code === subtitle.targetLanguage)?.flag || '🌐'}
                                </span>
                            </div>
                        </div>

                        {/* Hover hint */}
                        {!showOriginal && subtitle.originalText && (
                            <p className="text-white/40 text-xs text-center mt-2 font-pixel">
                                Hover to see original
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
