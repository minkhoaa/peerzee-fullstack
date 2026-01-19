'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Settings, Heart, Video } from 'lucide-react';
import { ProfileCardStack } from '@/components/discover';
import ModeSwitcher from '@/components/discover/ModeSwitcher';
import { useDiscover } from '@/hooks/useDiscover';
import { useMatchContext } from '@/components/MatchProvider';
import api from '@/lib/api';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

/**
 * DiscoverPage - Production-ready matching interface
 * Strict Notion Dark Mode theme
 * Uses React Query for data fetching with cursor pagination
 */
export default function DiscoverPage() {
    const router = useRouter();
    const { isConnected } = useMatchContext();
    const { users, isLoading, refetch, swipe, hasNextPage, fetchNextPage } = useDiscover();

    // Intent Mode state
    const [intentMode, setIntentMode] = useState<IntentMode>('DATE');
    const [isChangingMode, setIsChangingMode] = useState(false);

    // Likers count (for badge)
    const [likersCount, setLikersCount] = useState(0);

    // Load user's current mode and likers count on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [profileRes, likersRes] = await Promise.all([
                    api.get('/user/profile'),
                    api.get('/swipe/matches/likers'),
                ]);
                if (profileRes.data?.profile?.intentMode) {
                    setIntentMode(profileRes.data.profile.intentMode);
                }
                setLikersCount(likersRes.data?.count || 0);
            } catch (e) {
                console.error('Failed to load data:', e);
            }
        };
        loadData();
    }, []);

    // Handle mode change
    const handleModeChange = useCallback(async (mode: IntentMode) => {
        setIsChangingMode(true);
        try {
            await api.patch('/user/profile/properties', { intentMode: mode });
            setIntentMode(mode);
            // Refetch discover stack with new mode
            await refetch();
        } catch (e) {
            console.error('Failed to change mode:', e);
        } finally {
            setIsChangingMode(false);
        }
    }, [refetch]);

    // Handle swipe action
    const handleSwipe = async (
        userId: string,
        action: 'LIKE' | 'PASS' | 'SUPER_LIKE',
        contentId?: string,
        contentType?: 'photo' | 'prompt' | 'vibe',
    ) => {
        try {
            const result = await swipe({
                targetId: userId,
                action,
                likedContentId: contentId,
                likedContentType: contentType,
            });

            // If it's a match, show notification (handled by MatchProvider)
            if (result.isMatch) {
                console.log('Match found!', result.matchedUser);
            }
        } catch (error) {
            console.error('Swipe error:', error);
        }
    };

    // Handle empty state
    const handleEmpty = () => {
        if (hasNextPage) {
            fetchNextPage();
        } else {
            refetch();
        }
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

                    <h1 className="text-lg font-semibold text-[#E3E3E3]">Discover</h1>

                    <div className="flex items-center gap-1">
                        {/* Likers button with badge */}
                        <button
                            onClick={() => router.push('/likers')}
                            className="relative p-2 text-[#9B9A97] hover:text-pink-400 rounded-lg hover:bg-[#202020] transition-colors"
                            title="Who Liked You"
                        >
                            <Heart className="w-5 h-5" />
                            {likersCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {likersCount > 9 ? '9+' : likersCount}
                                </span>
                            )}
                        </button>

                        {/* Video Dating button */}
                        <button
                            onClick={() => router.push('/video-dating')}
                            className="p-2 text-[#9B9A97] hover:text-purple-400 rounded-lg hover:bg-[#202020] transition-colors"
                            title="Random Video Chat"
                        >
                            <Video className="w-5 h-5" />
                        </button>

                        {/* Connection indicator */}
                        <div
                            className={`w-2 h-2 rounded-full mx-1 ${isConnected ? 'bg-green-400' : 'bg-[#9B9A97]'
                                }`}
                        />

                        <button
                            onClick={() => router.push('/chat')}
                            className="p-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                            title="Messages"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>
                        <button
                            className="p-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mode Switcher */}
            <div className="max-w-lg mx-auto px-4 py-3">
                <ModeSwitcher
                    currentMode={intentMode}
                    onModeChange={handleModeChange}
                    isLoading={isChangingMode}
                />
            </div>

            {/* Main Content */}
            <main className="max-w-lg mx-auto">
                <ProfileCardStack
                    users={users}
                    onSwipe={handleSwipe}
                    onEmpty={handleEmpty}
                    isLoading={isLoading || isChangingMode}
                />
            </main>
        </div>
    );
}

