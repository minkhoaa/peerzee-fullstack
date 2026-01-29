'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MessageCircle, Settings, Heart, Video, Search, X, Sparkles, MapPin, Users, GraduationCap, Filter, Star, Briefcase } from 'lucide-react';
import { ProfileCardStack } from '@/components/discover';
import ModeSwitcher from '@/components/discover/ModeSwitcher';
import { LocationRequest } from '@/components/discover/LocationRequest';
import { useDiscover } from '@/hooks/useDiscover';
import { useMatchContext } from '@/components/MatchProvider';
import api, { discoverApi, swipeApi, userApi, SearchResult, SearchResponse } from '@/lib/api';
import { WoodenFrame, PixelButton } from '@/components/village';
import { GlobalHeader } from '@/components/layout';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';

/**
 * DiscoverPage - Production-ready matching interface with AI Search
 * Peerzee Village theme
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
        <div className="min-h-screen grass-dots">
            {/* Global Header */}
            <GlobalHeader
                title="QUEST BOARD"
                subtitle="Discover • Find Adventurers"
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/likers')}
                            className="relative w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
                            style={{ backgroundColor: '#6B5344', borderColor: '#261E1A' }}
                            title="Who Liked You"
                        >
                            <Heart className="w-5 h-5" style={{ color: '#E0C097' }} />
                            {likersCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center font-pixel text-[10px] rounded-full border-2"
                                    style={{ backgroundColor: '#EC4913', borderColor: '#B0320A', color: '#FDF5E6' }}>
                                    {likersCount > 9 ? '9+' : likersCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => router.push('/video-dating')}
                            className="w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
                            style={{ backgroundColor: '#6B5344', borderColor: '#261E1A' }}
                            title="Video Chat"
                        >
                            <Video className="w-5 h-5" style={{ color: '#E0C097' }} />
                        </button>
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
                            style={{ 
                                backgroundColor: showSearch ? '#EC4913' : '#6B5344', 
                                borderColor: '#261E1A' 
                            }}
                            title="AI Search"
                        >
                            <Sparkles className="w-5 h-5" style={{ color: '#E0C097' }} />
                        </button>
                        <div 
                            className="w-3 h-3 border-2" 
                            style={{ 
                                backgroundColor: isConnected ? '#4CAF50' : '#8B0000', 
                                borderColor: '#261E1A' 
                            }} 
                        />
                        <button
                            onClick={() => router.push('/chat')}
                            className="w-10 h-10 flex items-center justify-center border-2 transition-all hover:opacity-80"
                            style={{ backgroundColor: '#6B5344', borderColor: '#261E1A' }}
                        >
                            <MessageCircle className="w-5 h-5" style={{ color: '#E0C097' }} />
                        </button>
                    </div>
                }
            />

            {/* System Message */}
            {users.length > 0 && !searchResults.length && (
                <div className="max-w-4xl mx-auto px-4 mt-4">
                    <div className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] px-4 py-2 flex items-center gap-2">
                        <div className="w-6 h-6 bg-[var(--accent-blue)] flex items-center justify-center flex-shrink-0">
                            <span className="text-[var(--parchment)] text-xs">ℹ️</span>
                        </div>
                        <p className="font-mono text-xs md:text-sm text-[var(--text-pixel)]">
                            <span className="font-medium">SYSTEM MESSAGE:</span> {users.length} adventurers nearby waiting to meet you!
                        </p>
                    </div>
                </div>
            )}

            {/* AI Search Panel */}
            {showSearch && (
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <WoodenFrame variant="parchment">
                        <div className="p-4">
                            <h3 className="font-pixel text-lg text-[var(--text-pixel)] mb-3">🔮 AI QUEST SEARCH</h3>
                            
                            {/* Search Input */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-pixel)]/50" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleSearchKeyPress}
                                    placeholder="Mô tả người bạn muốn tìm..."
                                    className="carved-input w-full pl-10 pr-20"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching || !searchQuery.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 font-pixel text-xs border-2 border-[var(--border-dark)] transition-all ${searchQuery.trim() && !isSearching
                                        ? 'bg-[var(--landscape-green)] text-[var(--parchment)] hover:bg-[var(--landscape-green)]/80'
                                        : 'bg-[var(--wood-light)] text-[var(--parchment-dark)] cursor-not-allowed'
                                        }`}
                                >
                                    {isSearching ? '...' : 'SEARCH'}
                                </button>
                            </div>

                            {/* Sample Queries */}
                            {!searchFilters && (
                                <div className="flex flex-wrap gap-2">
                                    {sampleQueries.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSearchQuery(q)}
                                            className="px-3 py-1.5 text-[var(--text-pixel)] text-xs hover:bg-[var(--primary-orange)] hover:text-[var(--parchment)] transition-colors bg-white border-2 border-[var(--border-dark)]"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Extracted Filters */}
                            {searchFilters && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-pixel text-xs text-[var(--text-pixel)]">FILTERS:</span>
                                    {searchFilters.gender && (
                                        <span className="px-3 py-1 bg-[var(--accent-pink)] text-[var(--parchment)] text-xs border-2 border-[var(--border-dark)] font-medium">
                                            {searchFilters.gender === 'FEMALE' ? '👩 Nữ' : '👨 Nam'}
                                        </span>
                                    )}
                                    {searchFilters.city && (
                                        <span className="px-3 py-1 bg-[var(--accent-blue)] text-[var(--parchment)] text-xs border-2 border-[var(--border-dark)] flex items-center gap-1 font-medium">
                                            <MapPin className="w-3 h-3" /> {searchFilters.city}
                                        </span>
                                    )}
                                    {searchFilters.intent && (
                                        <span className="px-3 py-1 bg-[var(--landscape-green)] text-[var(--parchment)] text-xs border-2 border-[var(--border-dark)] flex items-center gap-1 font-medium">
                                            {searchFilters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" /> Học</>}
                                            {searchFilters.intent === 'DATE' && <><Heart className="w-3 h-3" /> Hẹn hò</>}
                                            {searchFilters.intent === 'FRIEND' && <><Users className="w-3 h-3" /> Bạn</>}
                                        </span>
                                    )}
                                    {searchFilters.semantic_text && (
                                        <span className="px-3 py-1 bg-[var(--primary-orange)] text-[var(--parchment)] text-xs border-2 border-[var(--border-dark)] truncate max-w-[150px] font-medium">
                                            🔍 {searchFilters.semantic_text}
                                        </span>
                                    )}
                                    <button onClick={clearSearch} className="ml-auto p-1.5 text-[var(--text-pixel)] hover:text-[var(--primary-red)] bg-white border-2 border-[var(--border-dark)] hover:bg-[var(--primary-red)]/10 transition-colors">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </WoodenFrame>
                </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="max-w-lg mx-auto px-4 py-4">
                    <WoodenFrame variant="parchment">
                        <div className="p-4">
                            {/* Results header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-pixel text-lg text-[var(--text-pixel)]">QUEST RESULTS</h3>
                                    <p className="text-xs text-[var(--text-pixel)]/70">{searchResults.length} adventurers found</p>
                                </div>
                                <button
                                    onClick={clearSearch}
                                    className="font-pixel text-xs text-[var(--primary-orange)] hover:text-[var(--primary-red)] px-3 py-1.5 border-2 border-[var(--border-dark)] hover:bg-[var(--primary-red)]/10 transition-colors"
                                >
                                    CLEAR
                                </button>
                            </div>

                            {/* Results list */}
                            <div className="space-y-3">
                                {searchResults.slice(0, 10).map((user, index) => {
                                    const scoreColor = user.matchScore >= 70 ? 'bg-[var(--landscape-green)]' : user.matchScore >= 40 ? 'bg-[var(--accent-yellow)]' : 'bg-[var(--wood-light)]';

                                    return (
                                        <div
                                            key={user.id}
                                            className="bg-white border-3 border-[var(--border-dark)] p-4 hover:bg-[var(--parchment-dark)] transition-all cursor-pointer"
                                            onClick={() => router.push(`/profile/${user.id}`)}
                                        >
                                            <div className="flex gap-4">
                                                {/* Avatar with rank */}
                                                <div className="relative shrink-0">
                                                    <div className="w-14 h-14 overflow-hidden bg-[var(--wood-light)] border-2 border-[var(--border-dark)]">
                                                        {user.photos?.[0]?.url ? (
                                                            <img src={user.photos[0].url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xl text-[var(--parchment)]">👤</div>
                                                        )}
                                                    </div>
                                                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-[var(--primary-orange)] border-2 border-[var(--border-dark)] flex items-center justify-center text-[10px] text-[var(--parchment)] font-pixel">
                                                        {index + 1}
                                                    </span>
                                                </div>

                                                {/* User info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-pixel text-[var(--text-pixel)] truncate">{user.display_name || 'Unknown'}</span>
                                                            {user.age && <span className="text-xs text-[var(--text-pixel)]/70">LVL {user.age}</span>}
                                                        </div>
                                                        <span className={`px-2 py-0.5 font-pixel text-sm text-[var(--parchment)] ${scoreColor} border-2 border-[var(--border-dark)]`}>
                                                            {user.matchScore}%
                                                        </span>
                                                    </div>

                                                    {user.occupation && (
                                                        <p className="text-xs text-[var(--text-pixel)]/70 mb-2">{user.occupation}</p>
                                                    )}

                                                    {/* Match reason */}
                                                    {user.matchReason && (
                                                        <div className="flex items-center gap-1.5 mb-2">
                                                            <Star className="w-3 h-3 text-[var(--accent-yellow)] fill-[var(--accent-yellow)]" />
                                                            <span className="text-xs text-[var(--accent-blue)]">{user.matchReason}</span>
                                                        </div>
                                                    )}

                                                    {/* Tags */}
                                                    {user.tags && user.tags.length > 0 && (
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            {user.tags.slice(0, 4).map((tag, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="px-2 py-0.5 bg-white text-[var(--text-pixel)] text-[11px] border border-[var(--border-dark)] font-medium"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {user.tags.length > 4 && (
                                                                <span className="px-2 py-0.5 text-[var(--text-pixel)]/70 text-[11px]">
                                                                    +{user.tags.length - 4}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score bar */}
                                            <div className="mt-3 pt-3 border-t-2 border-[var(--border-dark)]">
                                                <div className="flex items-center justify-between text-[10px] text-[var(--text-pixel)]/70 mb-1">
                                                    <span>COMPATIBILITY</span>
                                                    <span>{user.matchScore >= 70 ? 'LEGENDARY' : user.matchScore >= 40 ? 'RARE' : 'COMMON'}</span>
                                                </div>
                                                <div className="h-3 bg-[var(--wood-light)] border-2 border-[var(--border-dark)] overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${user.matchScore >= 70 ? 'bg-[var(--landscape-green)]' :
                                                            user.matchScore >= 40 ? 'bg-[var(--accent-yellow)]' :
                                                                'bg-[var(--wood-shadow)]'
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
                    </WoodenFrame>
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
                        <div className="mt-4">
                            <div className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] px-4 py-2 flex items-center justify-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--primary-orange)]" />
                                <span className="font-mono text-sm text-[var(--text-pixel)]">Searching within 50km radius</span>
                            </div>
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

            {/* Cards remaining indicator */}
            {users.length > 0 && !searchResults.length && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
                    <div className="bg-[var(--parchment)] border-3 border-[var(--border-dark)] px-4 py-2">
                        <p className="font-pixel text-xs md:text-sm text-[var(--text-pixel)]">
                            {users.length} ADVENTURERS WAITING
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
