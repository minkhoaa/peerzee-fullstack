'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import RetroAvatar from './RetroAvatar';
import RetroTag from './RetroTag';

interface PostAuthor {
    id: string;
    display_name: string;
    avatar?: string;
}

interface PostMedia {
    url: string;
    type: 'image' | 'video';
}

interface RetroPostCardProps {
    id: string;
    author: PostAuthor;
    content: string;
    media?: PostMedia[];
    tags?: string[];
    likesCount: number;
    commentsCount: number;
    isLiked?: boolean;
    createdAt: string;
    onLike?: (id: string) => void;
    onComment?: (id: string) => void;
    onShare?: (id: string) => void;
    className?: string;
}

/**
 * RetroPostCard - Cute Retro OS styled post card
 * Features: Thick borders, pixel accents, heart animations
 */
export default function RetroPostCard({
    id,
    author,
    content,
    media,
    tags,
    likesCount,
    commentsCount,
    isLiked = false,
    createdAt,
    onLike,
    onComment,
    onShare,
    className,
}: RetroPostCardProps) {
    const [liked, setLiked] = useState(isLiked);
    const [likes, setLikes] = useState(likesCount);

    const handleLike = () => {
        setLiked(!liked);
        setLikes(prev => liked ? prev - 1 : prev + 1);
        onLike?.(id);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <article
            className={clsx(
                'bg-retro-paper border-4 border-cocoa rounded-xl',
                'shadow-[4px_4px_0_0_#8D6E63]',
                'overflow-hidden',
                'animate-bounce-in',
                className
            )}
        >
            {/* Header */}
            <div className="p-4 flex items-center gap-3">
                <RetroAvatar
                    src={author.avatar}
                    fallback={author.display_name.slice(0, 2).toUpperCase()}
                    size="lg"
                    isOnline
                />
                <div className="flex-1 min-w-0">
                    <h3 className="font-pixel text-cocoa text-lg uppercase truncate">
                        {author.display_name}
                    </h3>
                    <p className="font-body text-xs text-cocoa-light">
                        {formatTime(createdAt)}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="font-body text-cocoa text-sm leading-relaxed whitespace-pre-wrap">
                    {content}
                </p>
            </div>

            {/* Media */}
            {media && media.length > 0 && (
                <div className="px-4 pb-3">
                    <div className={clsx(
                        'grid gap-2',
                        media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    )}>
                        {media.slice(0, 4).map((item, index) => (
                            <div
                                key={index}
                                className="relative border-3 border-cocoa rounded-lg overflow-hidden aspect-video"
                            >
                                {item.type === 'video' ? (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={item.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <RetroTag key={tag} variant="blue">
                            #{tag}
                        </RetroTag>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="border-t-3 border-cocoa px-4 py-3 flex items-center gap-4">
                <button
                    onClick={handleLike}
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5',
                        'border-2 border-cocoa rounded-lg',
                        'font-pixel text-sm uppercase',
                        'transition-all duration-100',
                        'shadow-[2px_2px_0_0_#5A3E36]',
                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
                        liked
                            ? 'bg-pixel-pink text-cocoa'
                            : 'bg-white text-cocoa hover:bg-pixel-pink/30'
                    )}
                >
                    <Heart
                        className={clsx(
                            'w-4 h-4 transition-all',
                            liked && 'fill-pixel-red text-pixel-red scale-110'
                        )}
                    />
                    <span>{likes}</span>
                </button>

                <button
                    onClick={() => onComment?.(id)}
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5',
                        'border-2 border-cocoa rounded-lg',
                        'font-pixel text-sm uppercase',
                        'bg-white text-cocoa hover:bg-pixel-blue',
                        'transition-all duration-100',
                        'shadow-[2px_2px_0_0_#5A3E36]',
                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    )}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>{commentsCount}</span>
                </button>

                <button
                    onClick={() => onShare?.(id)}
                    className={clsx(
                        'flex items-center gap-2 px-3 py-1.5 ml-auto',
                        'border-2 border-cocoa rounded-lg',
                        'font-pixel text-sm uppercase',
                        'bg-white text-cocoa hover:bg-pixel-blue',
                        'transition-all duration-100',
                        'shadow-[2px_2px_0_0_#5A3E36]',
                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    )}
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
}

/**
 * RetroPostCardSkeleton - Loading state
 */
export function RetroPostCardSkeleton() {
    return (
        <div className="bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] overflow-hidden animate-pulse">
            <div className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-cocoa-light/20 rounded-lg border-3 border-cocoa" />
                <div className="flex-1">
                    <div className="h-5 bg-cocoa-light/20 rounded w-32 mb-2" />
                    <div className="h-3 bg-cocoa-light/20 rounded w-20" />
                </div>
            </div>
            <div className="px-4 pb-4">
                <div className="h-4 bg-cocoa-light/20 rounded w-full mb-2" />
                <div className="h-4 bg-cocoa-light/20 rounded w-3/4" />
            </div>
            <div className="border-t-3 border-cocoa px-4 py-3 flex gap-4">
                <div className="h-8 bg-cocoa-light/20 rounded-lg w-20" />
                <div className="h-8 bg-cocoa-light/20 rounded-lg w-20" />
            </div>
        </div>
    );
}
