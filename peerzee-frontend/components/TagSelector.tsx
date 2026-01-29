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
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => {
                        const tagData = TAG_CATEGORIES.flatMap((c) => c.tags).find((t) => t.label === tag);
                        return (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-pixel-pink border-2 border-cocoa rounded-lg shadow-pixel-sm text-cocoa font-bold text-sm hover:bg-pixel-pink-dark transition-colors active:translate-y-0.5 active:shadow-none"
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
            <p className="text-sm font-bold text-cocoa-light">
                Đã chọn {selectedTags.length}/{maxTags} tags
            </p>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {TAG_CATEGORIES.map((cat, i) => (
                    <button
                        key={cat.name}
                        onClick={() => setActiveCategory(i)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-pixel uppercase tracking-wider whitespace-nowrap border-2 border-cocoa rounded-lg transition-all ${i === activeCategory
                                ? 'bg-pixel-blue text-cocoa shadow-pixel-sm'
                                : 'bg-retro-white text-cocoa-light hover:bg-retro-bg'
                            }`}
                    >
                        <span>{cat.emoji}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Tags grid */}
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {category.tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.label);
                    const isDisabled = !isSelected && selectedTags.length >= maxTags;
                    return (
                        <button
                            key={tag.label}
                            onClick={() => toggleTag(tag.label)}
                            disabled={isDisabled}
                            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-bold border-2 border-cocoa rounded-lg transition-all ${isSelected
                                    ? 'bg-pixel-green text-cocoa shadow-pixel-sm'
                                    : isDisabled
                                        ? 'bg-cocoa-light/20 text-cocoa-light border-cocoa-light cursor-not-allowed'
                                        : 'bg-retro-white text-cocoa hover:bg-retro-bg shadow-pixel-sm active:translate-y-0.5 active:shadow-none'
                                }`}
                        >
                            <span className="text-base">{tag.emoji}</span>
                            <span className="flex-1 text-left">{tag.label}</span>
                            {isSelected && <Check className="w-4 h-4 text-cocoa" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
