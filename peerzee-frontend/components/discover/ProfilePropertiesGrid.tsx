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
                <Icon className="w-3.5 h-3.5 text-[#9B9A97]" />
                <span className="text-xs text-[#9B9A97]">{label}</span>
            </div>

            {/* Value(s) */}
            <div className="flex flex-wrap gap-1">
                {Array.isArray(value) ? (
                    value.map((v, i) => (
                        <span
                            key={i}
                            className="text-xs text-[#E3E3E3] bg-[#2F2F2F] rounded-md px-2 py-0.5"
                        >
                            {v}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-[#E3E3E3] bg-[#2F2F2F] rounded-md px-2 py-0.5">
                        {value}
                    </span>
                )}
            </div>
        </div>
    );
};

/**
 * Notion-style profile properties grid
 * Renders user properties like Zodiac, MBTI, Habits in a database row format
 */
export default function ProfilePropertiesGrid({ properties }: ProfilePropertiesGridProps) {
    const hasProperties = properties && Object.values(properties).some(v =>
        v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)
    );

    if (!hasProperties) return null;

    return (
        <div className="mt-3 pt-3 border-t border-[#2F2F2F]">
            <PropertyRow icon={Star} label="Zodiac" value={properties.zodiac} />
            <PropertyRow icon={Brain} label="MBTI" value={properties.mbti} />
            <PropertyRow icon={Dumbbell} label="Habits" value={properties.habits} />
            <PropertyRow icon={Ruler} label="Height" value={properties.height} />
            <PropertyRow icon={Languages} label="Languages" value={properties.languages} />
            <PropertyRow icon={Target} label="Looking for" value={properties.lookingFor} />
        </div>
    );
}
