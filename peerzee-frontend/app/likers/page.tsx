'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
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
        <div className="min-h-screen bg-[#191919]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#191919]/95 backdrop-blur-lg border-b border-[#2F2F2F]">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
                        <h1 className="text-lg font-semibold text-[#E3E3E3]">Likes</h1>
                    </div>

                    <div className="w-9" /> {/* Spacer */}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
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
