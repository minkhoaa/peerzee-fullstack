'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, Star, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { VillageHeader, WoodenFrame, PixelButton } from '@/components/village';
import { swipeApi } from '@/lib/api';

interface Liker {
    id: string;
    display_name: string;
    avatar?: string;
    isSuperLike: boolean;
    likedAt: string;
    message?: string;
}

export default function LikersPage() {
    const router = useRouter();
    const [likers, setLikers] = useState<Liker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPremium] = useState(false);

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
        alert('Premium feature - Coming soon!');
    };

    return (
        <div className="min-h-screen grass-dots flex flex-col">
            <VillageHeader
                title="PEERZEE"
                subtitle="SECRET ADMIRER MAIL"
                showBack
                onBack={() => router.back()}
            />

            <div className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <WoodenFrame>
                        <div className="p-6 md:p-8">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-accent-pink border-3 border-wood-dark flex items-center justify-center relative">
                                    <Mail className="w-8 h-8 text-parchment" />
                                    {likers.length > 0 && (
                                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary-red border-2 border-parchment rounded-full flex items-center justify-center">
                                            <span className="font-pixel text-parchment text-xs">{likers.length}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="font-pixel text-2xl md:text-3xl text-wood-dark">SECRET FAN MAIL</h1>
                                    <p className="text-wood-dark/70 uppercase tracking-wide text-sm">
                                        {likers.length} Adventurers sent you hearts!
                                    </p>
                                </div>
                            </div>

                            <div className="w-full h-1 bg-wood-dark/30 mb-6" />

                            {/* Loading State */}
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="w-16 h-16 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mb-4" />
                                    <p className="font-pixel text-wood-dark">LOADING MAIL...</p>
                                </div>
                            ) : likers.length === 0 ? (
                                /* Empty State */
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-24 h-24 mx-auto mb-6 bg-parchment border-4 border-wood-dark flex items-center justify-center">
                                        <Heart className="w-12 h-12 text-cork" />
                                    </div>
                                    <h3 className="font-pixel text-2xl text-wood-dark mb-2">NO MAIL YET</h3>
                                    <p className="text-wood-dark/70 mb-6 max-w-sm mx-auto">
                                        Keep exploring the village and someone will send you a heart soon!
                                    </p>
                                    <PixelButton onClick={() => router.push('/discover')}>
                                        START EXPLORING
                                    </PixelButton>
                                </motion.div>
                            ) : (
                                <>
                                    {/* Premium Upsell Banner */}
                                    {!isPremium && (
                                        <div className="bg-gradient-to-r from-accent-yellow/30 to-primary-orange/30 border-3 border-wood-dark p-4 md:p-6 mb-6">
                                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-accent-yellow border-3 border-wood-dark flex items-center justify-center">
                                                        <Lock className="w-7 h-7 text-wood-dark" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-pixel text-lg text-wood-dark mb-1">UNLOCK PREMIUM LETTERS</h3>
                                                        <p className="text-sm text-wood-dark/80">
                                                            See who likes you and match instantly with Premium Village Pass!
                                                        </p>
                                                    </div>
                                                </div>
                                                <PixelButton variant="success" onClick={handleReveal}>
                                                    UPGRADE NOW
                                                </PixelButton>
                                            </div>
                                        </div>
                                    )}

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-parchment border-3 border-wood-dark p-4 text-center">
                                            <p className="font-pixel text-3xl text-primary-orange">{likers.length}</p>
                                            <p className="font-pixel text-sm text-wood-dark/70">TOTAL LIKES</p>
                                        </div>
                                        <div className="bg-parchment border-3 border-wood-dark p-4 text-center">
                                            <p className="font-pixel text-3xl text-accent-blue">
                                                {likers.filter(l => l.isSuperLike).length}
                                            </p>
                                            <p className="font-pixel text-sm text-wood-dark/70">SUPER LIKES</p>
                                        </div>
                                    </div>

                                    {/* Grid of Likers */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {likers.map((liker, index) => (
                                            <motion.div
                                                key={liker.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="relative group"
                                            >
                                                <div className="bg-white border-3 border-wood-dark overflow-hidden hover:border-primary-orange transition-colors cursor-pointer">
                                                    {/* Polaroid style */}
                                                    <div className="aspect-[3/4] relative overflow-hidden bg-wood-dark">
                                                        <img
                                                            src={liker.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${liker.id}`}
                                                            alt="Mystery admirer"
                                                            className={`w-full h-full object-cover ${!isPremium ? 'blur-lg' : ''}`}
                                                        />

                                                        {!isPremium && (
                                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                                                <Lock className="w-10 h-10 text-parchment mb-2" />
                                                                <span className="font-pixel text-parchment text-sm">LOCKED</span>
                                                            </div>
                                                        )}

                                                        {liker.isSuperLike && (
                                                            <div className="absolute top-2 right-2 bg-accent-yellow border-2 border-wood-dark px-2 py-1">
                                                                <Star className="w-4 h-4 text-wood-dark inline" />
                                                                <span className="font-pixel text-xs text-wood-dark ml-1">SUPER</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="p-3 bg-parchment border-t-3 border-wood-dark">
                                                        <p className="font-pixel text-sm text-wood-dark truncate">
                                                            {isPremium ? liker.display_name : `Mystery #${index + 1}`}
                                                        </p>
                                                        <p className="text-xs text-wood-dark/60">
                                                            {new Date(liker.likedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    {/* Heart indicator */}
                                                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-accent-pink border-2 border-wood-dark rounded-full flex items-center justify-center shadow-lg">
                                                        <Heart className="w-4 h-4 text-parchment fill-parchment" />
                                                    </div>

                                                    {/* Message indicator */}
                                                    {liker.message && (
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-blue border-2 border-wood-dark rounded-full flex items-center justify-center animate-bounce">
                                                            <Sparkles className="w-3 h-3 text-parchment" />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Bottom Tips */}
                                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                                        <div className="bg-cork/30 border-2 border-wood-dark p-4">
                                            <h4 className="font-pixel text-sm text-wood-dark mb-2">💡 TIP</h4>
                                            <p className="text-xs text-wood-dark/70">
                                                Keep swiping in Discover mode! The more you explore, the more matches you'll get.
                                            </p>
                                        </div>
                                        <div className="bg-cork/30 border-2 border-wood-dark p-4">
                                            <h4 className="font-pixel text-sm text-wood-dark mb-2">❓ HOW IT WORKS</h4>
                                            <p className="text-xs text-wood-dark/70">
                                                When someone likes you, they appear here. Match with them by liking them back!
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </WoodenFrame>
                </div>
            </div>
        </div>
    );
}
