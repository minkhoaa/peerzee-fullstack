'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Sparkles, MapPin, Users, GraduationCap, Heart, Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { discoverApi, SearchResponse, SearchResult } from '@/lib/api';
import { LocationButton } from '@/components/discover/LocationButton';

export default function SearchPage() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [filters, setFilters] = useState<SearchResponse['filters'] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
    const [searchRadius, setSearchRadius] = useState<number>(20);

    const sampleQueries = [
        'Find female AI students in Hanoi',
        'Male into gym and coffee',
        'Frontend developers',
        'People who love travel and photography',
    ];

    const handleSearch = useCallback(async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = userLocation
                ? await discoverApi.search(query, 10, userLocation.lat, userLocation.long, searchRadius)
                : await discoverApi.search(query);
            setResults(response.data.results);
            setFilters(response.data.filters);
        } catch (err: unknown) {
            console.error('Search error:', err);
            setError('Could not search. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [query, userLocation, searchRadius]);

    const handleSampleClick = (sample: string) => {
        setQuery(sample);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="min-h-screen bg-[#ECC8CD]">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#FDF0F1] shadow-sm rounded-b-[30px]">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-[#7A6862] hover:text-[#3E3229] rounded-full hover:bg-[#ECC8CD] transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="flex-1 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#CD6E67]" />
                        <h1 className="text-xl font-black text-[#3E3229] font-nunito">AI Search</h1>
                    </div>
                </div>
            </header>

            {/* Search Input */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Location Controls */}
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <p className="text-[#7A6862] text-sm font-semibold">Search radius:</p>
                        <select
                            value={searchRadius}
                            onChange={(e) => setSearchRadius(Number(e.target.value))}
                            className="px-4 py-2 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-bold text-sm focus:outline-none focus:border-[#CD6E67] transition-colors"
                        >
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={20}>20 km</option>
                            <option value={50}>50 km</option>
                            <option value={100}>100 km</option>
                        </select>
                    </div>
                    <LocationButton 
                        className="text-sm" 
                        onLocationUpdate={(lat, long) => setUserLocation({ lat, long })}
                    />
                </div>

                {/* Location Status */}
                {userLocation && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 px-4 py-3 bg-green-100 rounded-[20px] flex items-center gap-2"
                    >
                        <MapPin className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-600 flex-1">
                            Searching within {searchRadius}km from your location
                        </p>
                        <button
                            onClick={() => setUserLocation(null)}
                            className="p-1 hover:bg-green-200 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-green-600" />
                        </button>
                    </motion.div>
                )}

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6862]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Describe who you're looking for..."
                        className="w-full pl-14 pr-28 py-4 bg-white border-2 border-transparent rounded-full text-[#3E3229] placeholder-[#7A6862] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all shadow-lg"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isLoading || !query.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#CD6E67] text-white font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#B55B55] transition-colors shadow-md"
                    >
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {/* Sample Queries */}
                {!results.length && !filters && (
                    <div className="mt-6">
                        <p className="text-sm font-bold text-[#CD6E67] mb-3">Try searching:</p>
                        <div className="flex flex-wrap gap-2">
                            {sampleQueries.map((sample, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSampleClick(sample)}
                                    className="px-4 py-2 bg-white text-[#3E3229] font-bold text-sm rounded-full shadow-sm border-b-4 border-[#ECC8CD]/50 hover:shadow-md transition-all"
                                >
                                    {sample}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extracted Filters */}
                {filters && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-[#FDF0F1] rounded-[20px] shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-[#3E3229] flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[#CD6E67]" />
                                AI Analysis:
                            </span>
                            <button
                                onClick={() => { setFilters(null); setResults([]); }}
                                className="p-1 text-[#7A6862] hover:text-[#3E3229] rounded-full hover:bg-[#ECC8CD] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {filters.gender && (
                                <span className="px-3 py-1.5 bg-pink-100 text-pink-600 text-sm font-bold rounded-full">
                                    {filters.gender === 'FEMALE' ? '👩 Female' : '👨 Male'}
                                </span>
                            )}
                            {filters.city && (
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-600 text-sm font-bold rounded-full flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {filters.city}
                                </span>
                            )}
                            {filters.intent && (
                                <span className="px-3 py-1.5 bg-green-100 text-green-600 text-sm font-bold rounded-full flex items-center gap-1">
                                    {filters.intent === 'STUDY' && <><GraduationCap className="w-3 h-3" /> Study</>}
                                    {filters.intent === 'DATE' && <><Heart className="w-3 h-3" /> Date</>}
                                    {filters.intent === 'FRIEND' && <><Users className="w-3 h-3" /> Friends</>}
                                </span>
                            )}
                            {filters.semantic_text && (
                                <span className="px-3 py-1.5 bg-[#CD6E67]/10 text-[#CD6E67] text-sm font-bold rounded-full">
                                    🔍 {filters.semantic_text}
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="max-w-2xl mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-100 rounded-[20px] text-red-600 font-semibold"
                    >
                        {error}
                    </motion.div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#CD6E67] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[#7A6862] font-semibold">AI is searching...</p>
                    </div>
                </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
                <div className="max-w-2xl mx-auto px-4 pb-8">
                    <p className="text-sm font-bold text-[#CD6E67] mb-4">
                        Found {results.length} results
                    </p>
                    <div className="grid gap-4">
                        {results.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex gap-4 p-4 bg-[#FDF0F1] rounded-[30px] shadow-md hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => router.push(`/profile/${user.id}`)}
                            >
                                {/* Avatar */}
                                <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-[#ECC8CD] flex-shrink-0">
                                    {user.photos?.[0]?.url ? (
                                        <img
                                            src={user.photos[0].url}
                                            alt={user.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">
                                            👤
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h3 className="font-bold text-[#3E3229] truncate">
                                            {user.display_name || 'Unknown'}
                                        </h3>
                                        {user.age && (
                                            <span className="text-[#7A6862] font-semibold">{user.age}</span>
                                        )}
                                        {/* Distance Badge */}
                                        {user.distance_km !== undefined && (
                                            <span className="ml-auto px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {user.distance_km < 1 
                                                    ? `${Math.round(user.distance_km * 1000)}m`
                                                    : `${user.distance_km.toFixed(1)}km`}
                                            </span>
                                        )}
                                        {/* Match Score */}
                                        <span className={`${user.distance_km !== undefined ? '' : 'ml-auto'} px-2.5 py-1 bg-[#CD6E67]/10 text-[#CD6E67] text-xs font-bold rounded-full`}>
                                            {Math.min(100, Math.round(user.matchScore || 0))}% Match
                                        </span>
                                    </div>
                                    {user.occupation && (
                                        <p className="text-sm text-[#7A6862] font-semibold truncate">{user.occupation}</p>
                                    )}
                                    {user.bio && (
                                        <p className="text-sm text-[#7A6862] mt-1 line-clamp-2">{user.bio}</p>
                                    )}
                                    {user.tags && user.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {user.tags.slice(0, 3).map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-white text-[#3E3229] text-xs font-bold rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {user.tags.length > 3 && (
                                                <span className="text-xs text-[#7A6862] font-semibold">
                                                    +{user.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filters && results.length === 0 && (
                <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-[#3E3229] mb-2">
                        No results found
                    </h3>
                    <p className="text-[#7A6862] font-semibold">
                        Try a different search query
                    </p>
                </div>
            )}
        </div>
    );
}
