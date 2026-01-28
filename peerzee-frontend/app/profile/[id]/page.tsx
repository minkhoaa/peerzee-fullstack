'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Camera, Check, X, Heart, MessageCircle, Eye, Loader2 } from 'lucide-react';
import { chatApi, userApi } from '@/lib/api';

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
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
                <p className="text-[#9B9A97]">{error || 'Profile không tồn tại'}</p>
                <button onClick={() => router.back()} className="text-sm text-white hover:underline">
                    ← Quay lại
                </button>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    const coverPhoto = photos[0]?.url;

    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-lg">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-[#9B9A97] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
                {/* Profile Strength Card */}
                <div className="bg-[#1A1A1A] rounded-xl p-4 flex items-center gap-6">
                    {/* Circular Progress */}
                    <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90">
                            <circle
                                cx="40" cy="40" r="35"
                                fill="none"
                                stroke="#2A2A2A"
                                strokeWidth="6"
                            />
                            <circle
                                cx="40" cy="40" r="35"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${strength * 2.2} 220`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                            {strength}%
                        </span>
                    </div>

                    {/* Checklist */}
                    <div className="flex-1">
                        <h3 className="text-white font-medium mb-2">Profile Strength</h3>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <span className={photos.length > 0 ? 'text-blue-400' : 'text-[#9B9A97]'}>
                                    {photos.length > 0 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                                </span>
                                Profile photo
                            </div>
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <span className={profile.bio ? 'text-blue-400' : 'text-[#9B9A97]'}>
                                    {profile.bio ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-current" />}
                                </span>
                                Bio & interests
                            </div>
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <span className="text-red-400">
                                    <X className="w-4 h-4" />
                                </span>
                                ID verification
                            </div>
                        </div>
                    </div>

                    {/* AI Tip */}
                    <div className="hidden sm:block bg-[#1E3A5F] rounded-lg p-3 max-w-[180px]">
                        <p className="text-blue-400 text-xs font-medium mb-1">🤖 AI TIP</p>
                        <p className="text-[#9B9A97] text-xs">Complete ID verification to unlock premium matches</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden">
                    {/* Cover Photo */}
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400 relative">
                        {coverPhoto && (
                            <img src={coverPhoto} alt="" className="w-full h-full object-cover opacity-50" />
                        )}
                        <button className="absolute bottom-3 right-3 p-2 bg-[#1A1A1A]/80 rounded-lg text-white hover:bg-[#1A1A1A] transition-colors">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Avatar & Info */}
                    <div className="px-4 pb-4">
                        {/* Avatar */}
                        <div className="-mt-10 mb-3">
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-2xl font-bold border-4 border-[#1A1A1A]">
                                {photos.length > 0 ? (
                                    <img src={photos[0].url} alt="" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    profile.display_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                        </div>

                        {/* Name */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {profile.display_name || 'Unknown'}
                                    {profile.age && <span className="text-[#9B9A97] font-normal ml-2">{profile.age}</span>}
                                </h2>
                                <p className="text-[#9B9A97] text-sm">@{profile.display_name?.toLowerCase().replace(/\s/g, '') || 'user'}</p>
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-white text-sm rounded-lg transition-colors">
                                <Heart className="w-4 h-4" />
                                Like
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#252525] rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-white">94</p>
                                <p className="text-xs text-[#9B9A97]">Matches</p>
                            </div>
                            <div className="bg-[#252525] rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-white">127</p>
                                <p className="text-xs text-[#9B9A97]">Likes</p>
                            </div>
                            <div className="bg-[#252525] rounded-lg p-3 text-center">
                                <p className="text-xl font-bold text-white">32</p>
                                <p className="text-xs text-[#9B9A97]">Views</p>
                            </div>
                        </div>

                        {/* Verified badge */}
                        <div className="mt-3 flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-[#9B9A97] text-xs">Verified profile</span>
                        </div>
                    </div>
                </div>

                {/* About Card */}
                <div className="bg-[#1A1A1A] rounded-xl p-4">
                    <h3 className="text-white font-medium mb-3">About</h3>
                    <p className="text-[#9B9A97] text-sm leading-relaxed">
                        {profile.bio || 'No bio yet'}
                    </p>

                    {/* Location, Occupation */}
                    {(profile.location || profile.occupation) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {profile.location && (
                                <span className="px-3 py-1.5 bg-[#252525] text-[#9B9A97] text-sm rounded-lg">
                                    📍 {profile.location}
                                </span>
                            )}
                            {profile.occupation && (
                                <span className="px-3 py-1.5 bg-[#252525] text-[#9B9A97] text-sm rounded-lg">
                                    💼 {profile.occupation}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Tags */}
                    {profile.tags && profile.tags.length > 0 && (
                        <div className="mt-4">
                            <p className="text-[#9B9A97] text-xs mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-[#252525] text-white text-sm rounded-lg">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Card */}
                {photos.length > 1 && (
                    <div className="bg-[#1A1A1A] rounded-xl p-4">
                        <h3 className="text-white font-medium mb-3">Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {photos.map((photo, i) => (
                                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-[#252525]">
                                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Prompts Card */}
                {profile.prompts && profile.prompts.length > 0 && (
                    <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                        <h3 className="text-white font-medium">Prompts</h3>
                        {profile.prompts.map((prompt, i) => (
                            <div key={i} className="p-3 bg-[#252525] rounded-lg">
                                <p className="text-xs text-blue-400 mb-1">{prompt.question}</p>
                                <p className="text-white text-sm">{prompt.answer}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 py-3 bg-[#252525] text-[#9B9A97] rounded-xl hover:bg-[#303030] transition-colors flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Pass
                    </button>
                    <button
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Heart className="w-5 h-5" />
                        Like
                    </button>
                    <button
                        onClick={handleStartDM}
                        disabled={startingDM}
                        className="flex-1 py-3 bg-[#252525] text-white rounded-xl hover:bg-[#303030] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {startingDM ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <MessageCircle className="w-5 h-5" />
                        )}
                        Nhắn tin
                    </button>
                </div>
            </main>
        </div>
    );
}
