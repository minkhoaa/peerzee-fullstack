'use client';

import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { Image, Video, Send, Sparkles } from 'lucide-react';
import RetroAvatar from './RetroAvatar';
import RetroButton from './RetroButton';

interface RetroCreatePostProps {
    user?: {
        display_name: string;
        avatar?: string;
    };
    onSubmit: (data: {
        content: string;
        media?: File[];
    }) => void;
    isLoading?: boolean;
    className?: string;
}

/**
 * RetroCreatePost - Cute Retro OS styled post creation form
 * Features: "Send Thoughts" window, media upload, pixel animations
 */
export default function RetroCreatePost({
    user,
    onSubmit,
    isLoading = false,
    className,
}: RetroCreatePostProps) {
    const [content, setContent] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && mediaFiles.length === 0) return;
        onSubmit({ content, media: mediaFiles });
        setContent('');
        setMediaFiles([]);
        setMediaPreviews([]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const newFiles = files.slice(0, 4 - mediaFiles.length);
        setMediaFiles(prev => [...prev, ...newFiles]);

        // Generate previews
        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index: number) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
        setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div
            className={clsx(
                'bg-retro-paper border-4 border-cocoa rounded-xl overflow-hidden',
                'shadow-[4px_4px_0_0_#8D6E63]',
                className
            )}
        >
            {/* Window Title Bar */}
            <div className="bg-pixel-blue border-b-4 border-cocoa px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-pixel-red border-2 border-cocoa" />
                    <span className="w-3 h-3 rounded-full bg-pixel-yellow border-2 border-cocoa" />
                    <span className="w-3 h-3 rounded-full bg-pixel-green border-2 border-cocoa" />
                </div>
                <h2 className="font-pixel text-cocoa text-sm uppercase ml-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Send Thoughts
                </h2>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex gap-3">
                    <RetroAvatar
                        src={user?.avatar}
                        fallback={user?.display_name?.slice(0, 2).toUpperCase() || '??'}
                        size="lg"
                        isOnline
                    />
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind, player? ✨"
                            rows={3}
                            className={clsx(
                                'w-full px-4 py-3 resize-none',
                                'bg-white border-3 border-cocoa rounded-lg',
                                'font-body text-cocoa placeholder:text-cocoa-light',
                                'shadow-[inset_2px_2px_0_0_rgba(90,62,54,0.1)]',
                                'focus:outline-none focus:ring-2 focus:ring-pixel-pink focus:border-pixel-pink-dark'
                            )}
                        />
                    </div>
                </div>

                {/* Media Previews */}
                {mediaPreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                        {mediaPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                                <img
                                    src={preview}
                                    alt=""
                                    className="w-full aspect-square object-cover rounded-lg border-3 border-cocoa"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className={clsx(
                                        'absolute -top-2 -right-2 w-6 h-6',
                                        'bg-pixel-red border-2 border-cocoa rounded-full',
                                        'text-white font-pixel text-xs',
                                        'flex items-center justify-center',
                                        'shadow-[2px_2px_0_0_#5A3E36]',
                                        'active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                    )}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center justify-between border-t-2 border-dashed border-cocoa-light/50 pt-4">
                    <div className="flex gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={mediaFiles.length >= 4}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mediaFiles.length >= 4}
                            className={clsx(
                                'p-2 border-2 border-cocoa rounded-lg',
                                'text-cocoa hover:bg-pixel-pink/20',
                                'transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            <Image className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={mediaFiles.length >= 4}
                            className={clsx(
                                'p-2 border-2 border-cocoa rounded-lg',
                                'text-cocoa hover:bg-pixel-blue/50',
                                'transition-colors',
                                'disabled:opacity-50 disabled:cursor-not-allowed'
                            )}
                        >
                            <Video className="w-5 h-5" />
                        </button>
                    </div>

                    <RetroButton
                        type="submit"
                        disabled={isLoading || (!content.trim() && mediaFiles.length === 0)}
                        className="flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {isLoading ? 'Posting...' : 'Post'}
                    </RetroButton>
                </div>
            </form>
        </div>
    );
}
