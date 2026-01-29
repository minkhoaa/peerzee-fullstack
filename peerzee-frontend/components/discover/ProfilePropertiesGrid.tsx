'use client';

import React from 'react';
import { Star, Brain, Dumbbell, Ruler, Languages, Target } from 'lucide-react';

interface ProfileProperties {
    zodiac?: string;
    mbti?: string;
    habits?: string[];
    height?: string;
    languages?: string[];
    lookingFor?: string;
}

interface ProfilePropertiesGridProps {
    properties: ProfileProperties;
}

const PropertyRow = ({
    icon: Icon,
    label,
    value
}: {
    icon: React.ElementType;
    label: string;
    value: string | string[] | undefined;
}) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;

    return (
        <div className="flex items-center gap-3 py-1.5">
            {/* Icon + Label */}
            <div className="flex items-center gap-2 min-w-[100px]">
                <Icon className="w-3.5 h-3.5 text-cocoa-light" />
                <span className="text-xs text-cocoa-light font-bold uppercase">{label}</span>
            </div>

            {/* Value(s) */}
            <div className="flex flex-wrap gap-1.5">
                {Array.isArray(value) ? (
                    value.map((v, i) => (
                        <span
                            key={i}
                            className="text-xs text-cocoa bg-pixel-purple/50 rounded-lg px-2.5 py-1 border border-cocoa font-bold"
                        >
                            {v}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-cocoa bg-pixel-purple/50 rounded-lg px-2.5 py-1 border border-cocoa font-bold">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Retro Pixel OS styled profile properties grid
 * Renders user properties like Zodiac, MBTI, Habits in database row format
 */
export default function ProfilePropertiesGrid({ properties }: ProfilePropertiesGridProps) {
    const hasProperties = properties && Object.values(properties).some(v =>
        v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)
    );

    if (!hasProperties) return null;

    return (
        <div className="mt-3 pt-3 border-t-2 border-cocoa/30 mb-5">
            <PropertyRow icon={Star} label="Zodiac" value={properties.zodiac} />
            <PropertyRow icon={Brain} label="MBTI" value={properties.mbti} />
            <PropertyRow icon={Dumbbell} label="Habits" value={properties.habits} />
            <PropertyRow icon={Ruler} label="Height" value={properties.height} />
            <PropertyRow icon={Languages} label="Languages" value={properties.languages} />
            <PropertyRow icon={Target} label="Looking for" value={properties.lookingFor} />
        </div>
    );
}
