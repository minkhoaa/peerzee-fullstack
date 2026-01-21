'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Settings, Heart, Video, Search, X, Sparkles, MapPin, Users, GraduationCap, Filter } from 'lucide-react';
import { ProfileCardStack } from '@/components/discover';
import ModeSwitcher from '@/components/discover/ModeSwitcher';
import { useDiscover } from '@/hooks/useDiscover';
import { useMatchContext } from '@/components/MatchProvider';
import api, { discoverApi, SearchResult, SearchResponse } from '@/lib/api';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

/**
 * DiscoverPage - Production-ready matching interface with AI Search
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

    // Search state
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchFilters, setSearchFilters] = useState<SearchResponse['filters'] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Sample queries for inspiration
    const sampleQueries = [
        'Bạn nữ học AI Hà Nội',
        'Nam thích gym coffee',
        'Bạn học frontend',
        'Du lịch nhiếp ảnh',
    ];

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
            await refetch();
        } catch (e) {
            console.error('Failed to change mode:', e);
        } finally {
            setIsChangingMode(false);
        }
    }, [refetch]);

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await discoverApi.search(searchQuery);
            setSearchResults(response.data.results);
            setSearchFilters(response.data.filters);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    // Handle search key press
    const handleSearchKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchFilters(null);
        setShowSearch(false);
    };

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
                        <button
                            onClick={() => router.push('/video-dating')}
                            className="p-2 text-[#9B9A97] hover:text-purple-400 rounded-lg hover:bg-[#202020] transition-colors"
                            title="Video Chat"
                        >
                            <Video className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`p-2 rounded-lg hover:bg-[#202020] transition-colors ${showSearch ? 'text-cyan-400' : 'text-[#9B9A97] hover:text-cyan-400'}`}
                            title="AI Search"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                        <div className={`w-2 h-2 rounded-full mx-1 ${isConnected ? 'bg-green-400' : 'bg-[#9B9A97]'}`} />
                        <button
                            onClick={() => router.push('/chat')}
                            className="p-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* AI Search Panel */}
            {showSearch && (
                <div className="max-w-lg mx-auto px-4 py-3 border-b border-[#2F2F2F]">
                    {/* Search Input */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9A97]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            placeholder="Mô tả người bạn muốn tìm..."
                            className="w-full pl-10 pr-16 py-2 bg-transparent border border-[#2F2F2F] rounded-md text-sm text-[#E3E3E3] placeholder:text-[#9B9A97] focus:outline-none focus:border-[#505050] transition-colors"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs rounded transition-colors ${searchQuery.trim() && !isSearching
                                ? 'bg-[#2F2F2F] text-[#E3E3E3] hover:bg-[#37352F]'
                                : 'text-[#9B9A97] cursor-not-allowed'
                                }`}
                        >
                            {isSearching ? '...' : 'Tìm'}
                        </button>
                    </div>

                    {/* Sample Queries */}
                    {!searchFilters && (
                        <div className="flex flex-wrap gap-1.5">
                            {sampleQueries.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchQuery(q)}
                                    className="px-2 py-1 text-[#9B9A97] text-xs hover:bg-[#2F2F2F] rounded transition-colors"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Extracted Filters */}
                    {searchFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-[#9B9A97]">AI:</span>
                            {searchFilters.gender && (
                                <span className="px-2 py-0.5 bg-[#2F2F2F] text-[#E3E3E3] text-xs rounded">
                                    {searchFilters.gender === 'FEMALE' ? '👩 Nữ' : '👨 Nam'}
                                </span>
                            )}
                            {searchFilters.city && (
                                <span className="px-2 py-0.5 bg-[#2F2F2F] text-[#E3E3E3] text-xs rounded flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {searchFilters.city}
                                </span>
                            )}
                            {searchFilters.intent && (
                                <span className="px-2 py-0.5 bg-[#2F2F2F] text-[#E3E3E3] text-xs rounded flex items-center gap-1">
                                    {searchFilters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" /> Học</>}
                                    {searchFilters.intent === 'DATE' && <><Heart className="w-3 h-3" /> Hẹn hò</>}
                                    {searchFilters.intent === 'FRIEND' && <><Users className="w-3 h-3" /> Bạn</>}
                                </span>
                            )}
                            {searchFilters.semantic_text && (
                                <span className="px-2 py-0.5 bg-[#2F2F2F] text-[#9B9A97] text-xs rounded truncate max-w-[150px]">
                                    🔍 {searchFilters.semantic_text}
                                </span>
                            )}
                            <button onClick={clearSearch} className="ml-auto p-1 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results - Formal Design */}
            {searchResults.length > 0 && (
                <div className="max-w-lg mx-auto px-4 py-4">
                    {/* Results header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-white font-medium text-sm">Kết quả tìm kiếm</h3>
                            <p className="text-[#9B9A97] text-xs">{searchResults.length} người phù hợp</p>
                        </div>
                        <button
                            onClick={clearSearch}
                            className="text-xs text-[#9B9A97] hover:text-white px-2 py-1 hover:bg-[#2F2F2F] rounded transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>

                    {/* Results list */}
                    <div className="space-y-3">
                        {searchResults.slice(0, 10).map((user, index) => {
                            const scoreColor = user.matchScore >= 70 ? 'text-emerald-400' : user.matchScore >= 40 ? 'text-amber-400' : 'text-[#9B9A97]';
                            const scoreBorder = user.matchScore >= 70 ? 'border-emerald-500/30' : user.matchScore >= 40 ? 'border-amber-500/30' : 'border-[#2F2F2F]';

                            return (
                                <div
                                    key={user.id}
                                    className={`bg-[#1A1A1A] border ${scoreBorder} rounded-xl p-4 hover:bg-[#1E1E1E] transition-all cursor-pointer`}
                                    onClick={() => router.push(`/profile/${user.id}`)}
                                >
                                    <div className="flex gap-4">
                                        {/* Avatar with rank */}
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#252525]">
                                                {user.photos?.[0]?.url ? (
                                                    <img src={user.photos[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl text-[#505050]">👤</div>
                                                )}
                                            </div>
                                            <span className="absolute -top-1 -left-1 w-5 h-5 bg-[#252525] border border-[#2F2F2F] rounded-full flex items-center justify-center text-[10px] text-[#9B9A97] font-medium">
                                                {index + 1}
                                            </span>
                                        </div>

                                        {/* User info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium truncate">{user.display_name || 'Unknown'}</span>
                                                    {user.age && <span className="text-xs text-[#9B9A97]">• {user.age} tuổi</span>}
                                                </div>
                                                <span className={`text-lg font-semibold ${scoreColor}`}>
                                                    {user.matchScore}%
                                                </span>
                                            </div>

                                            {user.occupation && (
                                                <p className="text-xs text-[#9B9A97] mb-2">{user.occupation}</p>
                                            )}

                                            {/* Match reason - formal style */}
                                            {user.matchReason && (
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                                                    <span className="text-xs text-blue-400">{user.matchReason}</span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {user.tags && user.tags.length > 0 && (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {user.tags.slice(0, 4).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 bg-[#252525] text-[#9B9A97] text-[11px] rounded-md"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {user.tags.length > 4 && (
                                                        <span className="px-2 py-0.5 text-[#505050] text-[11px]">
                                                            +{user.tags.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score bar */}
                                    <div className="mt-3 pt-3 border-t border-[#252525]">
                                        <div className="flex items-center justify-between text-[10px] text-[#505050] mb-1">
                                            <span>Độ tương thích</span>
                                            <span>{user.matchScore >= 70 ? 'Rất cao' : user.matchScore >= 40 ? 'Khá cao' : 'Trung bình'}</span>
                                        </div>
                                        <div className="h-1.5 bg-[#252525] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${user.matchScore >= 70 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                                        user.matchScore >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                                                            'bg-gray-500'
                                                    }`}
                                                style={{ width: `${user.matchScore}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mode Switcher - only show when not in search mode */}
            {!searchResults.length && (
                <div className="max-w-lg mx-auto px-4 py-3">
                    <ModeSwitcher
                        currentMode={intentMode}
                        onModeChange={handleModeChange}
                        isLoading={isChangingMode}
                    />
                </div>
            )}

            {/* Main Content - only show when not in search mode */}
            {!searchResults.length && (
                <main className="max-w-lg mx-auto">
                    <ProfileCardStack
                        users={users}
                        onSwipe={handleSwipe}
                        onEmpty={handleEmpty}
                        isLoading={isLoading || isChangingMode}
                    />
                </main>
            )}
        </div>
    );
}
