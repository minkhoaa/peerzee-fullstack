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
            {/* Header - Wooden Beam Style */}
            <header className="sticky top-0 z-30 bg-wood-dark border-b-4 border-wood-shadow shadow-wood relative">
                {/* Wood grain texture overlay */}
                <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 20px,
                            rgba(0,0,0,0.1) 20px,
                            rgba(0,0,0,0.1) 21px
                        )`
                    }}
                />
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between relative">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-parchment hover:text-pixel-orange bg-wood-medium border-2 border-wood-shadow hover:bg-wood-light transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-pixel-orange fill-pixel-orange" strokeWidth={2.5} />
                        <h1 className="text-lg font-pixel uppercase tracking-widest text-parchment">Likes</h1>
                    </div>

                    <div className="w-9" /> {/* Spacer */}
                </div>
                {/* Decorative Nail/Rivet Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-around items-center px-8">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-wood-shadow border border-wood-light/30" />
                    ))}
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
