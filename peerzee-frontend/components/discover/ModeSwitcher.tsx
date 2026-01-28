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
    { id: 'DATE', label: 'Date', icon: Heart, color: 'text-white' },
    { id: 'STUDY', label: 'Study', icon: BookOpen, color: 'text-white' },
    { id: 'FRIEND', label: 'Friends', icon: Users, color: 'text-white' },
];

/**
 * Cozy Clay Candy Bar - Segmented control with extreme roundness
 * Updates user's mode via API and triggers stack refetch
 */
export default function ModeSwitcher({ currentMode, onModeChange, isLoading }: ModeSwitcherProps) {
    return (
        <div className="flex items-center justify-center gap-2 p-2 bg-[#FDF0F1] rounded-full shadow-lg shadow-[#CD6E67]/10">
            {modes.map((mode) => {
                const isActive = currentMode === mode.id;
                const Icon = mode.icon;

                return (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        disabled={isLoading}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-200
                            ${isActive
                                ? 'bg-[#CD6E67] text-white shadow-md transform scale-105'
                                : 'bg-transparent text-[#7A6862] hover:bg-[#ECC8CD]/30'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? mode.color : ''}`} />
                        <span className={`text-sm transition-colors ${isActive ? 'font-extrabold' : 'font-bold'}`}>
                            {mode.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
