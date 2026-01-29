'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Heart, MessageCircle, X, Loader2, MapPin, Briefcase, Check, Music, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { chatApi, userApi } from '@/lib/api';
import { VillageHeader, WoodenFrame, PixelButton } from '@/components/village';

interface UserProfileData {
    id: string;
    email: string;
    display_name: string;
    bio: string;
    location: string;
    age?: number;
    occupation?: string;
    education?: string;
    gender?: string;
    intentMode?: string;
    tags?: string[];
    photos?: { id: string; url: string; order?: number }[];
    prompts?: { id: string; question: string; answer: string }[];
    spotify?: { song: string; artist: string; cover?: string } | null;
    createdAt?: string;
}

export default function UserProfilePage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingDM, setStartingDM] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    useEffect(() => {
        if (!userId) return;
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        try {
            const res = await userApi.getUserProfile(userId);
            setProfile(res.data?.profile || res.data);
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Could not load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDM = async () => {
        if (startingDM) return;
        setStartingDM(true);
        try {
            const res = await chatApi.startDM(userId);
            router.push(`/chat?conversation=${res.data.conversationId}`);
        } catch (err) {
            console.error('Failed to start DM:', err);
            setStartingDM(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen grass-dots flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen grass-dots flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">😢</div>
                <p className="font-pixel text-wood-dark">{error || 'PROFILE NOT FOUND'}</p>
                <PixelButton onClick={() => router.back()}>
                    ← GO BACK
                </PixelButton>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    const coverPhoto = photos[activePhotoIndex]?.url || photos[0]?.url;

    return (
        <div className="min-h-screen grass-dots flex flex-col">
            <VillageHeader
                title="PEERZEE"
                subtitle="HERO REGISTRY • ADVENTURER PROFILE"
                showBack
                onBack={() => router.back()}
            />

            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Hero Card */}
                    <WoodenFrame>
                        <div className="p-6">
                            {/* Cover Photo */}
                            <div className="aspect-[16/10] border-4 border-wood-dark overflow-hidden bg-cork relative mb-6">
                                {coverPhoto ? (
                                    <img
                                        src={coverPhoto}
                                        alt={profile.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl">
                                        👤
                                    </div>
                                )}
                                
                                {/* Photo Navigation Dots */}
                                {photos.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {photos.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActivePhotoIndex(i)}
                                                className={`w-3 h-3 border-2 border-wood-dark transition-all ${
                                                    i === activePhotoIndex 
                                                        ? 'bg-primary-orange w-8' 
                                                        : 'bg-parchment/80 hover:bg-parchment'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Info Section */}
                            <div className="space-y-4">
                                {/* Name & Age */}
                                <div className="flex items-center gap-3">
                                    <h1 className="font-pixel text-3xl text-wood-dark">
                                        {profile.display_name || 'Unknown'}
                                    </h1>
                                    {profile.age && (
                                        <span className="bg-landscape-green border-2 border-wood-dark px-3 py-1 font-pixel text-parchment">
                                            LVL {profile.age}
                                        </span>
                                    )}
                                    <span className="w-6 h-6 bg-landscape-green border-2 border-wood-dark flex items-center justify-center">
                                        <Check className="w-4 h-4 text-parchment" />
                                    </span>
                                </div>

                                {/* Location & Occupation */}
                                <div className="flex flex-wrap gap-4">
                                    {profile.location && (
                                        <span className="flex items-center gap-2 text-wood-dark">
                                            <MapPin className="w-4 h-4 text-primary-orange" />
                                            <span className="font-pixel text-sm">{profile.location}</span>
                                        </span>
                                    )}
                                    {profile.occupation && (
                                        <span className="flex items-center gap-2 text-wood-dark/70">
                                            <Briefcase className="w-4 h-4" />
                                            <span className="text-sm">{profile.occupation}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Bio */}
                                {profile.bio && (
                                    <div className="bg-cork/30 border-2 border-wood-dark p-4">
                                        <p className="text-wood-dark leading-relaxed">{profile.bio}</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <PixelButton
                                        variant="primary"
                                        className="flex-1"
                                    >
                                        <Heart className="w-5 h-5" />
                                        LIKE
                                    </PixelButton>
                                    <PixelButton
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={handleStartDM}
                                        disabled={startingDM}
                                    >
                                        {startingDM ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <MessageCircle className="w-5 h-5" />
                                        )}
                                        MESSAGE
                                    </PixelButton>
                                    <button
                                        onClick={() => router.back()}
                                        className="w-14 h-14 bg-cork border-3 border-wood-dark flex items-center justify-center hover:bg-cork/70 transition-colors"
                                    >
                                        <X className="w-6 h-6 text-wood-dark" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </WoodenFrame>

                    {/* Widgets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Music Widget */}
                        {profile.spotify && (
                            <WoodenFrame>
                                <div className="p-6">
                                    <h3 className="font-pixel text-lg text-wood-dark mb-4">THEME SONG</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ rotate: isPlaying ? 360 : 0 }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: isPlaying ? Infinity : 0,
                                                    ease: "linear"
                                                }}
                                                className="w-16 h-16 bg-wood-dark border-4 border-primary-orange overflow-hidden flex items-center justify-center"
                                            >
                                                {profile.spotify.cover ? (
                                                    <img src={profile.spotify.cover} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="w-6 h-6 text-primary-orange" />
                                                )}
                                            </motion.div>
                                            <button
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-orange border-2 border-wood-dark flex items-center justify-center text-parchment"
                                            >
                                                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                            </button>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-pixel text-wood-dark truncate">
                                                {profile.spotify.song}
                                            </p>
                                            <p className="text-wood-dark/70 text-sm truncate">
                                                {profile.spotify.artist}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </WoodenFrame>
                        )}

                        {/* Interest Tags */}
                        {profile.tags && profile.tags.length > 0 && (
                            <WoodenFrame className={!profile.spotify ? 'md:col-span-2' : ''}>
                                <div className="p-6">
                                    <h3 className="font-pixel text-lg text-wood-dark mb-4">INTERESTS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.tags.map((tag, i) => (
                                            <motion.span
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 + i * 0.05 }}
                                                className="bg-primary-orange text-parchment px-3 py-2 font-pixel text-sm border-2 border-wood-dark"
                                            >
                                                {tag}
                                            </motion.span>
                                        ))}
                                    </div>
                                </div>
                            </WoodenFrame>
                        )}
                    </div>

                    {/* Prompts Card */}
                    {profile.prompts && profile.prompts.length > 0 && (
                        <WoodenFrame variant="cork">
                            <div className="p-6 space-y-4">
                                <h3 className="font-pixel text-xl text-wood-dark">ABOUT ME</h3>
                                {profile.prompts.map((prompt, i) => (
                                    <div key={i} className="bg-parchment border-2 border-wood-dark p-4">
                                        <p className="font-pixel text-sm text-primary-orange mb-2">{prompt.question}</p>
                                        <p className="text-wood-dark">{prompt.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </WoodenFrame>
                    )}

                    {/* Photo Grid */}
                    {photos.length > 1 && (
                        <WoodenFrame>
                            <div className="p-6">
                                <h3 className="font-pixel text-xl text-wood-dark mb-4">PHOTO GALLERY</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {photos.map((photo, i) => (
                                        <motion.div
                                            key={photo.id}
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setActivePhotoIndex(i)}
                                            className={`aspect-square border-3 overflow-hidden cursor-pointer ${
                                                i === activePhotoIndex 
                                                    ? 'border-primary-orange' 
                                                    : 'border-wood-dark hover:border-primary-orange/50'
                                            }`}
                                        >
                                            <img
                                                src={photo.url}
                                                alt=""
                                                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </WoodenFrame>
                    )}
                </div>
            </main>
        </div>
    );
}
