'use client';

import React from 'react';
import { Heart, BookOpen, Users } from 'lucide-react';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa
  textMuted: '#5D4037',      // Medium Brown
  background: '#FFFFFF',      // Pure White
  border: '#4A3228',          // Dark Coffee
  pink: '#F4B0C8',            // Retro Pink
  green: '#98D689',           // Pixel Green
  blue: '#7EC8E3',            // Soft Blue
} as const;

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

interface ModeSwitcherProps {
    currentMode: IntentMode;
    onModeChange: (mode: IntentMode) => void;
    isLoading?: boolean;
}

const modes: { id: IntentMode; label: string; icon: React.ElementType; color: string; emoji: string }[] = [
    { id: 'DATE', label: 'DATE', icon: Heart, color: COLORS.pink, emoji: '💕' },
    { id: 'STUDY', label: 'STUDY', icon: BookOpen, color: COLORS.blue, emoji: '📚' },
    { id: 'FRIEND', label: 'FRIEND', icon: Users, color: COLORS.green, emoji: '🤝' },
];

/**
 * ModeSwitcher - High Contrast Retro OS Style
 * Segmented control with pixel borders and hard shadows
 */
export default function ModeSwitcher({ currentMode, onModeChange, isLoading }: ModeSwitcherProps) {
    return (
        <div 
            className="flex items-center justify-center"
        >
            <div 
                className="inline-flex border-[3px] rounded-lg overflow-hidden shadow-[4px_4px_0px_#4A3228]"
                style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}
            >
                {modes.map((mode, index) => {
                    const isActive = currentMode === mode.id;
                    const Icon = mode.icon;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => onModeChange(mode.id)}
                            disabled={isLoading}
                            className={`
                                flex items-center gap-2 px-5 py-3 font-pixel text-sm uppercase transition-all
                                ${index !== 0 ? 'border-l-[2px]' : ''}
                                ${isActive 
                                    ? 'text-white' 
                                    : 'hover:bg-gray-50'
                                }
                                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            style={{ 
                                backgroundColor: isActive ? mode.color : COLORS.background,
                                color: isActive ? COLORS.border : COLORS.text,
                                borderColor: COLORS.border,
                            }}
                        >
                            <span className="text-base">{mode.emoji}</span>
                            <span className="hidden sm:inline">{mode.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
