'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Camera, Check, X, Star, MessageSquareText, Eye, Loader2, MapPin, Briefcase, Bot } from 'lucide-react';
import { chatApi, userApi, getAssetUrl } from '@/lib/api';

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
            setError('Không thể tải profile');
        } finally {
            setLoading(false);
        }
    };

    // Calculate profile strength
    const calculateStrength = () => {
        if (!profile) return 0;
        let score = 0;
        if (profile.photos && profile.photos.length > 0) score += 40;
        if (profile.bio) score += 30;
        if (profile.tags && profile.tags.length > 0) score += 20;
        if (profile.location) score += 10;
        return Math.min(score, 100);
    };

    // Start a DM conversation with this user
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

    const strength = calculateStrength();

    if (loading) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center">
                <div className="w-6 h-6 border-3 border-pixel-pink border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center gap-4">
                <p className="text-cocoa-light font-body font-bold">{error || 'Profile không tồn tại'}</p>
                <button onClick={() => router.back()} className="text-sm text-cocoa hover:underline font-body font-bold">
                    ← Quay lại
                </button>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    const coverPhoto = getAssetUrl(photos[0]?.url);

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
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center relative">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-parchment hover:text-pixel-orange bg-wood-medium border-2 border-wood-shadow hover:bg-wood-light transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
                {/* Decorative Nail/Rivet Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-around items-center px-8">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-wood-shadow border border-wood-light/30" />
                    ))}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
                {/* Profile Strength Card */}
                <div className="bg-retro-white rounded-xl p-4 flex items-center gap-6 border-3 border-cocoa shadow-pixel">
                    {/* Circular Progress */}
                    <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90">
                            <circle
                                cx="40" cy="40" r="35"
                                fill="none"
                                stroke="#D4C4B0"
                                strokeWidth="6"
                            />
                            <circle
                                cx="40" cy="40" r="35"
                                fill="none"
                                className="stroke-pixel-pink"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${strength * 2.2} 220`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-cocoa font-pixel font-semibold">
                            {strength}%
                        </span>
                    </div>

                    {/* Checklist */}
                    <div className="flex-1">
                        <h3 className="text-cocoa font-pixel uppercase tracking-wider mb-2">Profile Strength</h3>
                        <div className="space-y-1.5 text-sm font-body font-bold">
                            <div className="flex items-center gap-2 text-cocoa-light">
                                <span className={photos.length > 0 ? 'text-pixel-pink' : 'text-cocoa-light'}>
                                    {photos.length > 0 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                                </span>
                                Profile photo
                            </div>
                            <div className="flex items-center gap-2 text-cocoa-light">
                                <span className={profile.bio ? 'text-pixel-pink' : 'text-cocoa-light'}>
                                    {profile.bio ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                                </span>
                                Bio & interests
                            </div>
                            <div className="flex items-center gap-2 text-cocoa-light">
                                <span className="text-pixel-red">
                                    <X className="w-4 h-4" />
                                </span>
                                ID verification
                            </div>
                        </div>
                    </div>

                    {/* AI Tip */}
                    <div className="hidden sm:block bg-pixel-blue/20 rounded-lg p-3 max-w-[180px] border-2 border-cocoa shadow-pixel-sm">
                        <p className="text-pixel-blue text-xs font-pixel uppercase tracking-wider mb-1 flex items-center gap-1"><Bot className="w-3 h-3" /> AI TIP</p>
                        <p className="text-cocoa-light text-xs font-body font-bold">Complete ID verification to unlock premium matches</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-retro-white rounded-xl overflow-hidden border-3 border-cocoa shadow-pixel">
                    {/* Cover Photo */}
                    <div className="h-32 bg-gradient-to-r from-pixel-pink to-pixel-yellow relative">
                        {coverPhoto && (
                            <img src={coverPhoto} alt="" className="w-full h-full object-cover opacity-50" />
                        )}
                        <button className="absolute bottom-3 right-3 p-2 bg-retro-white/80 rounded-lg text-cocoa hover:bg-pixel-yellow transition-colors border-2 border-cocoa shadow-pixel-sm">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Avatar & Info */}
                    <div className="px-4 pb-4">
                        {/* Avatar */}
                        <div className="-mt-10 mb-3">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pixel-pink to-pixel-yellow flex items-center justify-center text-cocoa text-2xl font-pixel font-bold border-3 border-cocoa">
                                {photos.length > 0 ? (
                                    <img src={getAssetUrl(photos[0].url)} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    profile.display_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-pixel uppercase tracking-wider text-cocoa">
                                    {profile.display_name || 'Unknown'}
                                    {profile.age && <span className="text-cocoa-light font-body font-normal ml-2">{profile.age}</span>}
                                </h2>
                                <p className="text-cocoa-light text-sm font-body font-bold">@{profile.display_name?.toLowerCase().replace(/\s/g, '') || 'user'}</p>
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-cocoa/10 hover:bg-pixel-yellow text-cocoa text-sm rounded-lg transition-colors border-2 border-cocoa shadow-pixel-sm font-pixel">
                                <Star className="w-4 h-4" strokeWidth={2.5} />
                                Like
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-retro-white/80 rounded-lg p-3 text-center border-2 border-cocoa shadow-pixel-sm">
                                <p className="text-xl font-pixel text-cocoa">94</p>
                                <p className="text-xs text-cocoa-light font-body font-bold">Matches</p>
                            </div>
                            <div className="bg-retro-white/80 rounded-lg p-3 text-center border-2 border-cocoa shadow-pixel-sm">
                                <p className="text-xl font-pixel text-cocoa">127</p>
                                <p className="text-xs text-cocoa-light font-body font-bold">Likes</p>
                            </div>
                            <div className="bg-retro-white/80 rounded-lg p-3 text-center border-2 border-cocoa shadow-pixel-sm">
                                <p className="text-xl font-pixel text-cocoa">32</p>
                                <p className="text-xs text-cocoa-light font-body font-bold">Views</p>
                            </div>
                        </div>

                        {/* Verified badge */}
                        <div className="mt-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-pixel-pink rounded-full flex items-center justify-center border-2 border-cocoa">
                                <Check className="w-3 h-3 text-cocoa" />
                            </span>
                            <span className="text-cocoa-light text-xs font-body font-bold">Verified profile</span>
                        </div>
                    </div>
                </div>

                {/* About Card */}
                <div className="bg-retro-white rounded-xl p-4 border-3 border-cocoa shadow-pixel">
                    <h3 className="text-cocoa font-pixel uppercase tracking-wider mb-3">About</h3>
                    <p className="text-cocoa-light text-sm leading-relaxed font-body font-bold">
                        {profile.bio || 'No bio yet'}
                    </p>

                    {/* Location, Occupation */}
                    {(profile.location || profile.occupation) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {profile.location && (
                                <span className="px-3 py-1.5 bg-cocoa/10 text-cocoa-light text-sm rounded-lg border-2 border-cocoa shadow-pixel-sm font-body font-bold flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" /> {profile.location}
                                </span>
                            )}
                            {profile.occupation && (
                                <span className="px-3 py-1.5 bg-cocoa/10 text-cocoa-light text-sm rounded-lg border-2 border-cocoa shadow-pixel-sm font-body font-bold flex items-center gap-1.5">
                                    <Briefcase className="w-4 h-4" /> {profile.occupation}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {profile.tags && profile.tags.length > 0 && (
                        <div className="mt-4">
                            <p className="text-cocoa-light text-xs mb-2 font-body font-bold">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-pixel-yellow/30 text-cocoa text-sm rounded-lg border-2 border-cocoa shadow-pixel-sm font-body font-bold">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Card */}
                {photos.length > 1 && (
                    <div className="bg-retro-white rounded-xl p-4 border-3 border-cocoa shadow-pixel">
                        <h3 className="text-cocoa font-pixel uppercase tracking-wider mb-3">Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-cocoa/10 border-2 border-cocoa shadow-pixel-sm">
                                    <img src={getAssetUrl(photo.url)} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prompts Card */}
                {profile.prompts && profile.prompts.length > 0 && (
                    <div className="bg-retro-white rounded-xl p-4 space-y-3 border-3 border-cocoa shadow-pixel">
                        <h3 className="text-cocoa font-pixel uppercase tracking-wider">Prompts</h3>
                        {profile.prompts.map((prompt, i) => (
                            <div key={i} className="p-3 bg-cocoa/10 rounded-lg border-2 border-cocoa shadow-pixel-sm">
                                <p className="text-xs text-pixel-pink mb-1 font-pixel uppercase tracking-wider">{prompt.question}</p>
                                <p className="text-cocoa text-sm font-body font-bold">{prompt.answer}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-3 bg-retro-white text-cocoa-light border-3 border-cocoa rounded-xl hover:bg-pixel-red/20 transition-colors flex items-center justify-center gap-2 shadow-pixel font-pixel"
                    >
                        <X className="w-5 h-5" />
                        Pass
                    </button>
                    <button
                        className="flex-1 py-3 bg-pixel-pink text-cocoa border-3 border-cocoa rounded-xl hover:bg-pixel-pink/80 transition-colors flex items-center justify-center gap-2 shadow-pixel font-pixel"
                    >
                        <Star className="w-5 h-5" strokeWidth={2.5} />
                        Like
                    </button>
                    <button
                        onClick={handleStartDM}
                        disabled={startingDM}
                        className="flex-1 py-3 bg-pixel-yellow text-cocoa border-3 border-cocoa rounded-xl hover:bg-pixel-yellow/80 transition-colors flex items-center justify-center gap-2 shadow-pixel font-pixel disabled:opacity-50"
                    >
                        {startingDM ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <MessageSquareText className="w-5 h-5" strokeWidth={2.5} />
                        )}
                        Nhắn tin
                    </button>
                </div>
            </main>
        </div>
    );
}
