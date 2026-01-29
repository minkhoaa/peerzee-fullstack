'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Award, MapPin, Users, GraduationCap, Star, Filter, X } from 'lucide-react';
import { discoverApi, SearchResponse, SearchResult } from '@/lib/api';
import { LocationButton } from '@/components/discover/LocationButton';

/**
 * AI Search Page - Hybrid Semantic Search
 * Natural language queries parsed by AI
 */
export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [filters, setFilters] = useState<SearchResponse['filters'] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(20); // Default 20km

    // Sample queries for inspiration
    const sampleQueries = [
        'Tìm bạn nữ học AI ở Hà Nội',
        'Nam thích gym và coffee',
        'Bạn học lập trình frontend',
        'Người thích du lịch và nhiếp ảnh',
    ];

    // Handle search
    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Include location if available
            const response = userLocation
                ? await discoverApi.search(query, 10, userLocation.lat, userLocation.long, searchRadius)
                : await discoverApi.search(query);
            setResults(response.data.results);
            setFilters(response.data.filters);
        } catch (err: unknown) {
            console.error('Search error:', err);
            setError('Không thể tìm kiếm. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    }, [query, userLocation, searchRadius]);

    // Handle sample query click
    const handleSampleClick = (sample: string) => {
        setQuery(sample);
    };

    // Handle key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-[#191919]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#191919]/95 backdrop-blur-lg border-b border-[#2F2F2F]">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" strokeWidth={2.5} />
                        <h1 className="text-lg font-semibold text-[#E3E3E3]">AI Search</h1>
                    </div>
                </div>
            </header>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Location Controls */}
                <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <p className="text-[#9B9A97] text-xs">Bán kính tìm kiếm:</p>
                        <select
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Number(e.target.value))}
                            className="px-2 py-1 bg-[#252525] border border-[#2F2F2F] rounded-lg text-[#E3E3E3] text-xs focus:outline-none focus:border-purple-500/50"
                        >
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={20}>20 km</option>
                            <option value={50}>50 km</option>
                            <option value={100}>100 km</option>
                        </select>
                    </div>
                    <LocationButton 
                        className="text-xs" 
                        onLocationUpdate={(lat, long) => setUserLocation({ lat, long })}
                    />
                </div>

                {/* Location Status */}
                {userLocation && (
                    <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <p className="text-xs text-green-400">
                            Đang tìm trong bán kính {searchRadius}km từ vị trí của bạn
                        </p>
                        <button
                            onClick={() => setUserLocation(null)}
                            className="ml-auto p-1 hover:bg-green-500/20 rounded"
                        >
                            <X className="w-3 h-3 text-green-400" />
                        </button>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9A97]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Mô tả người bạn muốn tìm..."
                        className="w-full pl-12 pr-24 py-3 bg-[#252525] border border-[#2F2F2F] rounded-xl text-[#E3E3E3] placeholder:text-[#9B9A97] focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>

                {/* Sample Queries */}
                {!results.length && !filters && (
                    <div className="mt-4">
                        <p className="text-sm text-[#9B9A97] mb-2">Thử tìm kiếm:</p>
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((sample, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSampleClick(sample)}
                                    className="px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-[#E3E3E3] text-sm rounded-full border border-[#2F2F2F] transition-colors"
                                >
                                    {sample}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extracted Filters */}
                {filters && (
                    <div className="mt-4 p-3 bg-[#252525] rounded-xl border border-[#2F2F2F]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#9B9A97] flex items-center gap-1">
                                <Filter className="w-4 h-4" />
                                AI đã phân tích:
                            </span>
                            <button
                                onClick={() => { setFilters(null); setResults([]); }}
                                className="text-[#9B9A97] hover:text-[#E3E3E3]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.gender && (
                                <span className="px-2 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-full">
                                    {filters.gender === 'FEMALE' ? '👩 Nữ' : '👨 Nam'}
                                </span>
                            )}
                            {filters.city && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {filters.city}
                                </span>
                            )}
                            {filters.intent && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                                    {filters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" strokeWidth={2.5} /> Học tập</>}
                                    {filters.intent === 'DATE' && <><Star className="w-3 h-3" strokeWidth={2.5} /> Hẹn hò</>}
                                    {filters.intent === 'FRIEND' && <><Users className="w-3 h-3" strokeWidth={2.5} /> Kết bạn</>}
                                </span>
                            )}
                            {filters.semantic_text && (
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                                    🔍 {filters.semantic_text}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-2xl mx-auto px-4">
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#9B9A97] text-sm">AI đang tìm kiếm...</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
                <div className="max-w-2xl mx-auto px-4 pb-8">
                    <p className="text-sm text-[#9B9A97] mb-4">
                        Tìm thấy {results.length} kết quả
                    </p>
                    <div className="grid gap-4">
                        {results.map((user) => (
                            <div
                                key={user.id}
                                className="flex gap-4 p-4 bg-[#252525] rounded-xl border border-[#2F2F2F] hover:border-purple-500/30 transition-colors cursor-pointer"
                                onClick={() => router.push(`/profile/${user.id}`)}
                            >
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#303030] flex-shrink-0">
                                    {user.photos?.[0]?.url ? (
                                        <img
                                            src={user.photos[0].url}
                                            alt={user.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            👤
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-[#E3E3E3] truncate">
                                            {user.display_name || 'Unknown'}
                                        </h3>
                                        {user.age && (
                                            <span className="text-[#9B9A97] text-sm">{user.age}</span>
                                        )}
                                        {/* Distance Badge (if location-based search) */}
                                        {user.distance_km !== undefined && (
                                            <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {user.distance_km < 1 
                                                    ? `${Math.round(user.distance_km * 1000)}m`
                                                    : `${user.distance_km.toFixed(1)}km`}
                                            </span>
                                        )}
                                        {/* Match Score - Fixed bug */}
                                        <span className={`${user.distance_km !== undefined ? '' : 'ml-auto'} px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 text-xs font-medium rounded-full`}>
                                            {Math.min(100, Math.round(user.matchScore || 0))}% Match
                                        </span>
                                    </div>
                                    {user.occupation && (
                                        <p className="text-sm text-[#9B9A97] truncate">{user.occupation}</p>
                                    )}
                                    {user.bio && (
                                        <p className="text-sm text-[#9B9A97] mt-1 line-clamp-2">{user.bio}</p>
                                    )}
                                    {user.tags && user.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {user.tags.slice(0, 3).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-[#303030] text-[#9B9A97] text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {user.tags.length > 3 && (
                                                <span className="text-xs text-[#9B9A97]">
                                                    +{user.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filters && results.length === 0 && (
                <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-[#E3E3E3] mb-2">
                        Không tìm thấy kết quả
                    </h3>
                    <p className="text-[#9B9A97] text-sm">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </div>
            )}
        </div>
    );
}
