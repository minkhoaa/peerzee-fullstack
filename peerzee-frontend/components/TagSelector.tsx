'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { TAG_CATEGORIES, TagCategory } from '@/lib/profile-tags';

interface TagSelectorProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
}

export function TagSelector({ selectedTags, onChange, maxTags = 5 }: TagSelectorProps) {
    const [activeCategory, setActiveCategory] = useState(0);

    const toggleTag = (label: string) => {
        if (selectedTags.includes(label)) {
            onChange(selectedTags.filter((t) => t !== label));
        } else if (selectedTags.length < maxTags) {
            onChange([...selectedTags, label]);
        }
    };

    const category = TAG_CATEGORIES[activeCategory];

    return (
        <div className="space-y-3">
            {/* Selected tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => {
                        const tagData = TAG_CATEGORIES.flatMap((c) => c.tags).find((t) => t.label === tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-lg hover:bg-blue-600/30 transition-colors"
                            >
                                <span>{tagData?.emoji}</span>
                                <span>{tag}</span>
                                <X className="w-3 h-3 ml-0.5" />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Counter */}
            <p className="text-xs text-[#9B9A97]">
                Đã chọn {selectedTags.length}/{maxTags} tags
            </p>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {TAG_CATEGORIES.map((cat, i) => (
                    <button
                        key={cat.name}
                        onClick={() => setActiveCategory(i)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${i === activeCategory
                                ? 'bg-[#303030] text-white'
                                : 'text-[#9B9A97] hover:bg-[#252525]'
                            }`}
                    >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Tags grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {category.tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    const isDisabled = !isSelected && selectedTags.length >= maxTags;
                    return (
                        <button
                            key={tag.label}
                            onClick={() => toggleTag(tag.label)}
                            disabled={isDisabled}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${isSelected
                                    ? 'bg-blue-600 text-white'
                                    : isDisabled
                                        ? 'bg-[#1A1A1A] text-[#505050] cursor-not-allowed'
                                        : 'bg-[#252525] text-white hover:bg-[#303030]'
                                }`}
                        >
                            <span>{tag.emoji}</span>
                            <span className="flex-1 text-left">{tag.label}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
