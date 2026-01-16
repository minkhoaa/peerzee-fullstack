'use client';

import React from 'react';
import { Heart, BookOpen, Users } from 'lucide-react';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

interface ModeSwitcherProps {
    currentMode: IntentMode;
    onModeChange: (mode: IntentMode) => void;
    isLoading?: boolean;
}

const modes: { id: IntentMode; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'DATE', label: 'Date', icon: Heart, color: 'text-pink-500' },
    { id: 'STUDY', label: 'Study', icon: BookOpen, color: 'text-blue-500' },
    { id: 'FRIEND', label: 'Friends', icon: Users, color: 'text-green-500' },
];

/**
 * Bumble-style segmented control for switching intent modes
 * Updates user's mode via API and triggers stack refetch
 */
export default function ModeSwitcher({ currentMode, onModeChange, isLoading }: ModeSwitcherProps) {
    return (
        <div className="flex items-center justify-center gap-1 p-1 bg-[#202020] rounded-xl border border-[#2F2F2F]">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={isLoading}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                            ${isActive
                                ? 'bg-[#2F2F2F] shadow-sm'
                                : 'hover:bg-[#2A2A2A]'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <Icon
                            className={`w-4 h-4 transition-colors ${isActive ? mode.color : 'text-[#9B9A97]'
                                }`}
                        />
                        <span
                            className={`text-sm font-medium transition-colors ${isActive ? 'text-[#E3E3E3]' : 'text-[#9B9A97]'
                                }`}
                        >
                            {mode.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
