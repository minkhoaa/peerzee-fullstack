'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAssetUrl } from '@/lib/api';

interface LikerPreview {
    id: string;
    display_name: string;
    avatar?: string;
}

interface DiscoverRightPanelProps {
    likerPreviews: LikerPreview[];
    likersCount: number;
}

const FALLBACK_COLORS = ['bg-pixel-pink', 'bg-pixel-purple', 'bg-pixel-blue'];

export default function DiscoverRightPanel({ likerPreviews, likersCount }: DiscoverRightPanelProps) {
    const router = useRouter();
    const extraCount = Math.max(0, likersCount - likerPreviews.length);

    return (
        <div className="h-full flex flex-col bg-retro-paper border-2 border-cocoa rounded-xl p-4 gap-4 shadow-pixel">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-pixel text-cocoa uppercase tracking-widest">Thích bạn</span>
                {likersCount > 0 && (
                    <span className="px-2 py-0.5 bg-pixel-pink border-2 border-cocoa rounded font-pixel text-xs text-cocoa shadow-pixel-sm">
                        {likersCount > 99 ? '99+' : likersCount}
                    </span>
                )}
            </div>

            <div className="h-px bg-cocoa/20" />

            {likersCount === 0 ? (
                /* Empty state */
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-2">
                    <span className="text-2xl">✨</span>
                    <p className="text-xs font-pixel text-cocoa-light leading-relaxed">
                        Chưa có ai thích bạn hôm nay
                    </p>
                </div>
            ) : (
                /* Liker previews */
                <div className="flex flex-col gap-3 flex-1">
                    {likerPreviews.map((liker, i) => {
                        const avatarUrl = getAssetUrl(liker.avatar);
                        return (
                            <div
                                key={liker.id}
                                className="flex items-center gap-2.5 cursor-pointer"
                                onClick={() => router.push('/likers')}
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl border-2 border-cocoa overflow-hidden flex-shrink-0 flex items-center justify-center ${FALLBACK_COLORS[i % FALLBACK_COLORS.length]}`}
                                    style={{ filter: 'blur(4px)' }}
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-pixel text-lg">
                                            {(liker.display_name || '?').slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-pixel text-cocoa-light tracking-widest">
                                    ???
                                </span>
                            </div>
                        );
                    })}

                    {extraCount > 0 && (
                        <p className="text-[10px] text-cocoa-light font-bold text-center">
                            +{extraCount} người khác
                        </p>
                    )}
                </div>
            )}

            <div className="mt-auto">
                <button
                    onClick={() => router.push('/likers')}
                    className="w-full py-2.5 bg-pixel-pink text-cocoa border-2 border-cocoa rounded-lg font-pixel text-xs uppercase tracking-widest shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all active:translate-y-1"
                >
                    Xem ai thích bạn
                </button>
            </div>
        </div>
    );
}
