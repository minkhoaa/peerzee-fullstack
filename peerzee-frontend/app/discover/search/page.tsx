'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Award, MapPin, Users, GraduationCap, Star, Filter, X } from 'lucide-react';
import { discoverApi, SearchResponse, SearchResult } from '@/lib/api';
import { LocationButton } from '@/components/discover/LocationButton';

/**
 * AI Search Page - Hybrid Semantic Search
 * Natural language queries parsed by AI
 * Retro Pixel OS Design System
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
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3 relative">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-parchment hover:text-pixel-orange bg-wood-medium border-2 border-wood-shadow hover:bg-wood-light transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                        <Award className="w-5 h-5 text-pixel-orange" strokeWidth={2.5} />
                        <h1 className="text-lg font-pixel text-parchment">AI Search</h1>
                    </div>
                </div>
                {/* Decorative Nail/Rivet Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-around items-center px-8">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-wood-shadow border border-wood-light/30" />
                    ))}
                </div>
            </header>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Location Controls */}
                <div className="flex items-center justify-between mb-3 gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <p className="text-cocoa-light text-xs font-body">Bán kính tìm kiếm:</p>
                        <select
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Number(e.target.value))}
                            className="px-2 py-1 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa text-xs font-body focus:outline-none focus:ring-2 focus:ring-pixel-pink/30 shadow-pixel-sm"
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
                    <div className="mb-3 px-3 py-2 bg-pixel-green/20 border-3 border-cocoa rounded-lg flex items-center gap-2 shadow-pixel-sm">
                        <MapPin className="w-4 h-4 text-pixel-green" />
                        <p className="text-xs text-cocoa font-body font-bold">
                            Đang tìm trong bán kính {searchRadius}km từ vị trí của bạn
                        </p>
                        <button
                            onClick={() => setUserLocation(null)}
                            className="ml-auto p-1 hover:bg-pixel-green/20 rounded"
                        >
                            <X className="w-3 h-3 text-cocoa" />
                        </button>
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Mô tả người bạn muốn tìm..."
                        className="w-full pl-12 pr-24 py-3 bg-retro-white border-3 border-cocoa rounded-xl text-cocoa placeholder:text-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-pink/30 transition-all font-body font-bold shadow-pixel-sm"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-pixel-pink text-cocoa border-2 border-cocoa text-sm font-pixel rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pixel-pink/80 transition-colors shadow-pixel-sm"
                    >
                        {isLoading ? 'Đang tìm...' : 'Tìm kiếm'}
                    </button>
                </div>

                {/* Sample Queries */}
                {!results.length && !filters && (
                    <div className="mt-4">
                        <p className="text-sm text-cocoa-light mb-2 font-body">Thử tìm kiếm:</p>
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((sample, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSampleClick(sample)}
                                    className="px-3 py-1.5 bg-retro-white hover:bg-pixel-yellow text-cocoa text-sm font-body rounded-full border-3 border-cocoa transition-colors shadow-pixel-sm"
                                >
                                    {sample}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extracted Filters */}
                {filters && (
                    <div className="mt-4 p-3 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-cocoa-light flex items-center gap-1 font-body">
                                <Filter className="w-4 h-4" />
                                AI đã phân tích:
                            </span>
                            <button
                                onClick={() => { setFilters(null); setResults([]); }}
                                className="text-cocoa-light hover:text-cocoa"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.gender && (
                                <span className="px-2 py-1 bg-pixel-pink/20 text-pixel-pink text-xs font-pixel rounded-full border-2 border-cocoa">
                                    {filters.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                                </span>
                            )}
                            {filters.city && (
                                <span className="px-2 py-1 bg-pixel-blue/20 text-pixel-blue text-xs font-pixel rounded-full flex items-center gap-1 border-2 border-cocoa">
                                    <MapPin className="w-3 h-3" />
                                    {filters.city}
                                </span>
                            )}
                            {filters.intent && (
                                <span className="px-2 py-1 bg-pixel-green/20 text-pixel-green text-xs font-pixel rounded-full flex items-center gap-1 border-2 border-cocoa">
                                    {filters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" strokeWidth={2.5} /> Học tập</>}
                                    {filters.intent === 'DATE' && <><Star className="w-3 h-3" strokeWidth={2.5} /> Hẹn hò</>}
                                    {filters.intent === 'FRIEND' && <><Users className="w-3 h-3" strokeWidth={2.5} /> Kết bạn</>}
                                </span>
                            )}
                            {filters.semantic_text && (
                                <span className="px-2 py-1 bg-pixel-pink/20 text-pixel-pink text-xs font-pixel rounded-full flex items-center gap-1 border-2 border-cocoa">
                                    <Search className="w-3 h-3" strokeWidth={2.5} /> {filters.semantic_text}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-2xl mx-auto px-4">
                    <div className="p-3 bg-red-500/10 border-3 border-cocoa rounded-lg text-red-500 text-sm font-body shadow-pixel-sm">
                        {error}
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-3 border-pixel-pink border-t-transparent rounded-full animate-spin" />
                        <p className="text-cocoa-light text-sm font-body">AI đang tìm kiếm...</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
                <div className="max-w-2xl mx-auto px-4 pb-8">
                    <p className="text-sm text-cocoa-light mb-4 font-body">
                        Tìm thấy {results.length} kết quả
                    </p>
                    <div className="grid gap-4">
                        {results.map((user) => (
                            <div
                                key={user.id}
                                className="flex gap-4 p-4 bg-retro-white rounded-xl border-3 border-cocoa hover:border-pixel-pink transition-colors cursor-pointer shadow-pixel"
                                onClick={() => router.push(`/profile/${user.id}`)}
                            >
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-cocoa/10 border-3 border-cocoa flex-shrink-0">
                                    {user.photos?.[0]?.url ? (
                                        <img
                                            src={user.photos[0].url}
                                            alt={user.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Users className="w-8 h-8 text-cocoa-light" strokeWidth={2.5} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-pixel text-cocoa truncate">
                                            {user.display_name || 'Unknown'}
                                        </h3>
                                        {user.age && (
                                            <span className="text-cocoa-light text-sm font-body">{user.age}</span>
                                        )}
                                        {/* Distance Badge (if location-based search) */}
                                        {user.distance_km !== undefined && (
                                            <span className="ml-auto px-2 py-0.5 bg-pixel-blue/20 text-pixel-blue text-xs font-pixel rounded-full flex items-center gap-1 border-2 border-cocoa">
                                                <MapPin className="w-3 h-3" />
                                                {user.distance_km < 1 
                                                    ? `${Math.round(user.distance_km * 1000)}m`
                                                    : `${user.distance_km.toFixed(1)}km`}
                                            </span>
                                        )}
                                        {/* Match Score - Fixed bug */}
                                        <span className={`${user.distance_km !== undefined ? '' : 'ml-auto'} px-2 py-0.5 bg-pixel-pink/20 text-pixel-pink text-xs font-pixel rounded-full border-2 border-cocoa`}>
                                            {Math.min(100, Math.round(user.matchScore || 0))}% Match
                                        </span>
                                    </div>
                                    {user.occupation && (
                                        <p className="text-sm text-cocoa-light truncate font-body">{user.occupation}</p>
                                    )}
                                    {user.bio && (
                                        <p className="text-sm text-cocoa-light mt-1 line-clamp-2 font-body">{user.bio}</p>
                                    )}
                                    {user.tags && user.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {user.tags.slice(0, 3).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-cocoa/10 text-cocoa-light text-xs font-body rounded-full border-2 border-cocoa"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {user.tags.length > 3 && (
                                                <span className="text-xs text-cocoa-light font-body">
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
                    <div className="mb-4 flex justify-center"><Search className="w-12 h-12 text-cocoa-light" strokeWidth={2.5} /></div>
                    <h3 className="text-lg font-pixel text-cocoa mb-2">
                        Không tìm thấy kết quả
                    </h3>
                    <p className="text-cocoa-light text-sm font-body">
                        Thử tìm kiếm với từ khóa khác
                    </p>
                </div>
            )}
        </div>
    );
}
