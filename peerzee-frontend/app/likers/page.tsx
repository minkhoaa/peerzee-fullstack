'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import LikersGrid from '@/components/discover/LikersGrid';
import { swipeApi } from '@/lib/api';

interface Liker {
    id: string;
    display_name: string;
    avatar?: string;
    isSuperLike: boolean;
    likedAt: string;
    message?: string;
}

/**
 * LikersPage - Shows who liked you (blurred for free users)
 */
export default function LikersPage() {
    const router = useRouter();
    const [likers, setLikers] = useState<Liker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPremium] = useState(false); // TODO: Get from user context

    useEffect(() => {
        const fetchLikers = async () => {
            try {
                const res = await swipeApi.getLikers();
                setLikers(res.data.likers || []);
            } catch (e) {
                console.error('Failed to fetch likers:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLikers();
    }, []);

    const handleReveal = () => {
        // TODO: Show premium upgrade modal
        alert('Premium feature - Coming soon!');
    };

    return (
        <div className="min-h-screen bg-retro-bg">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-retro-white border-b-3 border-cocoa shadow-pixel">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-cocoa hover:bg-pixel-blue rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-pixel-pink fill-pixel-pink" strokeWidth={2.5} />
                        <h1 className="text-lg font-pixel uppercase tracking-widest text-cocoa">Likes</h1>
                    </div>

                    <div className="w-9" /> {/* Spacer */}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-10 h-10 border-3 border-pixel-pink border-t-transparent rounded-lg animate-spin" />
                    </div>
                ) : (
                    <LikersGrid
                        likers={likers}
                        isPremium={isPremium}
                        onReveal={handleReveal}
                    />
                )}
            </main>
        </div>
    );
}
