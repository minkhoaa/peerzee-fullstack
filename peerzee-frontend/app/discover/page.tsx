'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquareText, Settings, Star, Video, Search, X, Telescope, MapPin, Users, GraduationCap, ListFilter, Target, Loader2, User } from 'lucide-react';
import { ProfileCardStack } from '@/components/discover';
import ModeSwitcher from '@/components/discover/ModeSwitcher';
import { LocationRequest } from '@/components/discover/LocationRequest';
import { useDiscover } from '@/hooks/useDiscover';
import { useMatchContext } from '@/components/MatchProvider';
import api, { discoverApi, swipeApi, userApi, SearchResult, SearchResponse } from '@/lib/api';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

/**
 * DiscoverPage - Production-ready matching interface with AI Search
 * Strict Notion Dark Mode theme
 * Uses React Query for data fetching with cursor pagination
 */
export default function DiscoverPage() {
    const router = useRouter();
    const { isConnected } = useMatchContext();

    // Location state - must be declared before useDiscover hook
    const [hasLocation, setHasLocation] = useState<boolean | null>(null);
    const [userCoords, setUserCoords] = useState<{ lat: number; long: number } | null>(null);

    const { users, isLoading, refetch, swipe, hasNextPage, fetchNextPage } = useDiscover(
        userCoords ? { lat: userCoords.lat, long: userCoords.long, radius: 50 } : undefined
    );

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
                    userApi.getUserProfile('me'),
                    swipeApi.getLikers(),
                ]);
                if (profileRes.data?.profile?.intentMode) {
                    setIntentMode(profileRes.data.profile.intentMode);
                }
                // Check if user has location set
                if (profileRes.data?.profile?.latitude && profileRes.data?.profile?.longitude) {
                    setHasLocation(true);
                    setUserCoords({
                        lat: profileRes.data.profile.latitude,
                        long: profileRes.data.profile.longitude,
                    });
                } else {
                    setHasLocation(false);
                }
                setLikersCount(likersRes.data?.count || 0);
            } catch (e) {
                console.error('Failed to load data:', e);
                setHasLocation(false);
            }
        };
        loadData();
    }, []);

    // Handle location grant
    const handleLocationGranted = (coords: { lat: number; long: number }) => {
        setHasLocation(true);
        setUserCoords(coords);
        refetch(); // Refetch recommendations with new location
    };

    // Handle mode change
    const handleModeChange = useCallback(async (mode: IntentMode) => {
        setIsChangingMode(true);
        try {
            await userApi.updateProperties({ intentMode: mode });
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
        <div className="min-h-screen bg-retro-bg">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-retro-white border-b-3 border-cocoa shadow-pixel">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-cocoa hover:text-pixel-pink-dark border-3 border-transparent hover:border-cocoa rounded-lg hover:shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <h1 className="font-pixel text-2xl text-cocoa uppercase tracking-widest flex items-center gap-2"><Search className="w-5 h-5" strokeWidth={2.5} /> DISCOVER</h1>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/likers')}
                            className="relative p-2 text-cocoa hover:text-pixel-pink-dark border-3 border-transparent hover:border-cocoa rounded-lg hover:bg-pixel-pink hover:shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none"
                            title="Who Liked You"
                        >
                            <Star className="w-5 h-5" strokeWidth={2.5} />
                            {likersCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pixel-red border-2 border-cocoa text-white text-[10px] font-pixel rounded-lg flex items-center justify-center shadow-pixel-sm">
                                    {likersCount > 9 ? '9+' : likersCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => router.push('/match')}
                            className="p-2 text-cocoa hover:text-pixel-pink-dark border-3 border-transparent hover:border-cocoa rounded-lg hover:bg-pixel-blue hover:shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none"
                            title="Arcade Match (Text/Video)"
                        >
                            <Video className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`p-2 border-3 rounded-lg transition-all active:translate-y-0.5 active:shadow-none ${showSearch ? 'text-cocoa bg-pixel-yellow border-cocoa shadow-pixel-sm' : 'text-cocoa border-transparent hover:border-cocoa hover:bg-pixel-yellow hover:shadow-pixel-sm'}`}
                            title="AI Search"
                        >
                            <Telescope className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <div className={`w-3 h-3 border-2 border-cocoa rounded-lg mx-1 ${isConnected ? 'bg-pixel-green' : 'bg-cocoa-light'}`} />
                        <button
                            onClick={() => router.push('/chat')}
                            className="p-2 text-cocoa hover:text-pixel-pink-dark border-3 border-transparent hover:border-cocoa rounded-lg hover:bg-pixel-pink hover:shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none"
                        >
                            <MessageSquareText className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                        <button className="p-2 text-cocoa hover:text-pixel-pink-dark border-3 border-transparent hover:border-cocoa rounded-lg hover:bg-pixel-blue hover:shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {/* Decorative Pixel Line */}
                <div className="h-1 bg-gradient-to-r from-pixel-pink via-pixel-blue to-pixel-green" />
            </header>

            {/* AI Search Panel */}
            {showSearch && (
                <div className="max-w-4xl mx-auto px-4 py-4 bg-retro-paper border-b-3 border-cocoa">
                    {/* Search Input */}
                    <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleSearchKeyPress}
                            placeholder="Mô tả người bạn muốn tìm..."
                            className="w-full pl-12 pr-24 py-4 bg-retro-white border-3 border-cocoa rounded-lg font-body font-bold text-cocoa placeholder:text-cocoa-light shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-colors"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 font-pixel uppercase tracking-wider text-sm rounded-lg border-3 transition-all active:translate-y-0.5 active:shadow-none ${searchQuery.trim() && !isSearching
                                ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark'
                                : 'bg-retro-bg border-cocoa-light text-cocoa-light cursor-not-allowed'
                                }`}
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <><Search className="w-4 h-4" strokeWidth={2.5} /> TÌM</>}
                        </button>
                    </div>

                    {/* Sample Queries */}
                    {!searchFilters && (
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchQuery(q)}
                                    className="px-3 py-1.5 bg-retro-white border-3 border-cocoa text-cocoa font-body font-bold text-xs rounded-lg shadow-pixel-sm hover:bg-pixel-blue transition-all active:translate-y-0.5 active:shadow-none"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Extracted Filters */}
                    {searchFilters && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-pixel text-xs text-cocoa uppercase tracking-wider">AI:</span>
                            {searchFilters.gender && (
                                <span className="px-2 py-1 bg-pixel-pink border-2 border-cocoa text-cocoa font-body font-bold text-xs rounded-lg shadow-pixel-sm flex items-center gap-1">
                                    <User className="w-3 h-3" strokeWidth={2.5} /> {searchFilters.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                                </span>
                            )}
                            {searchFilters.city && (
                                <span className="px-2 py-1 bg-pixel-blue border-2 border-cocoa text-cocoa font-body font-bold text-xs rounded-lg shadow-pixel-sm flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {searchFilters.city}
                                </span>
                            )}
                            {searchFilters.intent && (
                                <span className="px-2 py-1 bg-pixel-green border-2 border-cocoa text-cocoa font-body font-bold text-xs rounded-lg shadow-pixel-sm flex items-center gap-1">
                                    {searchFilters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" strokeWidth={2.5} /> Học</>}
                                    {searchFilters.intent === 'DATE' && <><Star className="w-3 h-3" strokeWidth={2.5} /> Hẹn hò</>}
                                    {searchFilters.intent === 'FRIEND' && <><Users className="w-3 h-3" strokeWidth={2.5} /> Bạn</>}
                                </span>
                            )}
                            {searchFilters.semantic_text && (
                                <span className="px-2 py-1 bg-pixel-yellow border-2 border-cocoa text-cocoa font-body font-bold text-xs rounded-lg shadow-pixel-sm truncate max-w-[150px] flex items-center gap-1">
                                    <Search className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} /> {searchFilters.semantic_text}
                                </span>
                            )}
                            <button onClick={clearSearch} className="ml-auto p-1.5 text-cocoa hover:text-pixel-red border-2 border-transparent hover:border-cocoa hover:bg-pixel-red/20 rounded-lg transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results - Retro Pixel Style */}
            {searchResults.length > 0 && (
                <div className="max-w-lg mx-auto px-4 py-4">
                    {/* Results header */}
                    <div className="flex items-center justify-between mb-4 p-3 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-sm">
                        <div>
                            <h3 className="font-pixel text-cocoa uppercase tracking-wider text-sm flex items-center gap-1"><Target className="w-4 h-4" strokeWidth={2.5} /> KẾT QUẢ TÌM KIẾM</h3>
                            <p className="font-body text-cocoa-light font-bold text-xs">{searchResults.length} người phù hợp</p>
                        </div>
                        <button
                            onClick={clearSearch}
                            className="font-pixel text-xs text-cocoa uppercase tracking-wider px-3 py-1.5 border-3 border-cocoa rounded-lg hover:bg-pixel-red hover:text-white transition-all active:translate-y-0.5 active:shadow-none"
                        >
                            ✕ XÓA
                        </button>
                    </div>

                    {/* Results list */}
                    <div className="space-y-3">
                        {searchResults.slice(0, 10).map((user, index) => {
                            const scoreColor = user.matchScore >= 70 ? 'bg-pixel-green' : user.matchScore >= 40 ? 'bg-pixel-yellow' : 'bg-retro-bg';
                            const scoreBorder = 'border-cocoa';

                            return (
                                <div
                                    key={user.id}
                                    className={`bg-retro-white border-3 ${scoreBorder} rounded-xl p-4 shadow-pixel hover:translate-y-[-2px] hover:shadow-pixel-lg transition-all cursor-pointer`}
                                    onClick={() => router.push(`/profile/${user.id}`)}
                                >
                                    <div className="flex gap-4">
                                        {/* Avatar with rank */}
                                        <div className="relative shrink-0">
                                            <div className="w-14 h-14 rounded-lg overflow-hidden bg-retro-bg border-3 border-cocoa">
                                                {user.photos?.[0]?.url ? (
                                                    <img src={user.photos[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-cocoa-light"><User className="w-6 h-6" strokeWidth={2.5} /></div>
                                                )}
                                            </div>
                                            <span className="absolute -top-2 -left-2 w-6 h-6 bg-pixel-pink border-2 border-cocoa rounded-lg flex items-center justify-center font-pixel text-xs text-cocoa shadow-pixel-sm">
                                                {index + 1}
                                            </span>
                                        </div>

                                        {/* User info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-body font-bold text-cocoa truncate">{user.display_name || 'Unknown'}</span>
                                                    {user.age && <span className="font-pixel text-xs text-cocoa-light">• {user.age} tuổi</span>}
                                                </div>
                                                <span className={`font-pixel text-lg text-cocoa px-2 py-0.5 ${scoreColor} border-2 border-cocoa rounded-lg`}>
                                                    {user.matchScore}%
                                                </span>
                                            </div>

                                            {user.occupation && (
                                                <p className="font-body text-xs text-cocoa-light font-bold mb-2">{user.occupation}</p>
                                            )}

                                            {/* Match reason - retro style */}
                                            {user.matchReason && (
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className="font-body text-xs text-cocoa font-bold bg-pixel-blue px-2 py-0.5 border-2 border-cocoa rounded-lg">{user.matchReason}</span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {user.tags && user.tags.length > 0 && (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {user.tags.slice(0, 4).map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-0.5 bg-retro-paper border-2 border-cocoa text-cocoa font-body font-bold text-[11px] rounded-lg"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {user.tags.length > 4 && (
                                                        <span className="px-2 py-0.5 text-cocoa-light font-pixel text-[11px]">
                                                            +{user.tags.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score bar */}
                                    <div className="mt-3 pt-3 border-t-3 border-dashed border-cocoa/30">
                                        <div className="flex items-center justify-between font-pixel text-[10px] text-cocoa-light uppercase tracking-wider mb-1">
                                            <span>Độ tương thích</span>
                                            <span>{user.matchScore >= 70 ? 'RẤT CAO' : user.matchScore >= 40 ? 'KHÁ CAO' : 'TRUNG BÌNH'}</span>
                                        </div>
                                        <div className="h-3 bg-retro-bg border-2 border-cocoa rounded-lg overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${user.matchScore >= 70 ? 'bg-pixel-green' :
                                                    user.matchScore >= 40 ? 'bg-pixel-yellow' :
                                                        'bg-pixel-blue'
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
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <ModeSwitcher
                        currentMode={intentMode}
                        onModeChange={handleModeChange}
                        isLoading={isChangingMode}
                    />

                    {/* Location Request Banner */}
                    {hasLocation === false && (
                        <div className="mt-3">
                            <LocationRequest
                                onLocationGranted={handleLocationGranted}
                                compact={true}
                            />
                        </div>
                    )}

                    {/* Show distance info when location enabled */}
                    {hasLocation === true && userCoords && (
                        <div className="mt-4 flex items-center justify-center gap-2 p-3 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-sm">
                            <MapPin className="w-4 h-4 text-pixel-pink-dark" />
                            <span className="font-pixel text-sm text-cocoa uppercase tracking-wider flex items-center gap-1"><MapPin className="w-4 h-4" strokeWidth={2.5} /> Tìm kiếm trong bán kính 50km</span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content - only show when not in search mode */}
            {!searchResults.length && (
                <main className="max-w-4xl mx-auto px-4 flex flex-col items-center pb-8">
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
