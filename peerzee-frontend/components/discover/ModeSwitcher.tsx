'use client';

import React from 'react';
import { Star, BookOpen, Users } from 'lucide-react';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

interface ModeSwitcherProps {
    currentMode: IntentMode;
    onModeChange: (mode: IntentMode) => void;
    isLoading?: boolean;
}

const modes: { id: IntentMode; label: string; icon: React.ElementType; activeColor: string; emoji: string }[] = [
    { id: 'DATE', label: 'DATE', icon: Star, activeColor: 'bg-pixel-pink', emoji: '💕' },
    { id: 'STUDY', label: 'STUDY', icon: BookOpen, activeColor: 'bg-pixel-blue', emoji: '📚' },
    { id: 'FRIEND', label: 'FRIENDS', icon: Users, activeColor: 'bg-pixel-green', emoji: '🤝' },
];

/**
 * Retro Pixel Mode Switcher - Game Mode Selection Bar
 * Updates user's mode via API and triggers stack refetch
 */
export default function ModeSwitcher({ currentMode, onModeChange, isLoading }: ModeSwitcherProps) {
    return (
        <div className="flex items-center justify-center gap-1 p-2 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={isLoading}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 border-2 border-cocoa rounded-lg transition-all font-pixel uppercase tracking-wider text-sm
                            ${isActive
                                ? `${mode.activeColor} text-cocoa shadow-pixel-sm`
                                : 'bg-transparent text-cocoa-light hover:bg-retro-bg border-transparent'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:translate-y-0.5 active:shadow-none'}
                        `}
                    >
                        <span className="text-base">{mode.emoji}</span>
                        <span>{mode.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
