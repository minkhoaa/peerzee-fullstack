'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, X, Loader2, Play, Pause, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileApi } from '@/lib/api';

interface MusicTrack {
    trackId: string;
    songName: string;
    artistName: string;
    coverUrl: string;
    previewUrl: string | null;
    albumName?: string;
    genre?: string;
}

interface VibeAnalysis {
    mood: string;
    color: string;
    keywords: string[];
    description: string;
}

interface MusicData {
    trackId?: string;
    song: string;
    artist: string;
    cover: string;
    previewUrl?: string;
    analysis?: VibeAnalysis;
}

interface VibeMatchProps {
    currentMusic?: MusicData | null;
    onMusicSet?: (data: MusicData) => void;
}

export function VibeMatch({ currentMusic, onMusicSet }: VibeMatchProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MusicTrack[]>([]);
    const [searching, setSearching] = useState(false);
    const [setting, setSetting] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const { data } = await profileApi.searchMusic(searchQuery);
            setResults(data || []);
        } catch (err) {
            console.error('Search failed:', err);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 500);
    };

    const handleSelectTrack = async (track: MusicTrack) => {
        if (!track.previewUrl) {
            alert('This song has no preview available');
            return;
        }

        setSetting(true);
        stopAudio();

        try {
            const { data } = await profileApi.setMusic({
                trackId: track.trackId,
                song: track.songName,
                artist: track.artistName,
                previewUrl: track.previewUrl,
                cover: track.coverUrl,
            });

            if (onMusicSet) {
                onMusicSet({
                    trackId: track.trackId,
                    song: track.songName,
                    artist: track.artistName,
                    cover: track.coverUrl,
                    previewUrl: track.previewUrl,
                    analysis: data.analysis,
                });
            }

            setShowSearch(false);
            setQuery('');
            setResults([]);
        } catch (err) {
            console.error('Failed to set music:', err);
            alert('Could not analyze song. Please try again!');
        } finally {
            setSetting(false);
        }
    };

    const togglePlay = (track: MusicTrack) => {
        if (!track.previewUrl) return;

        if (playingId === track.trackId) {
            stopAudio();
        } else {
            stopAudio();
            audioRef.current = new Audio(track.previewUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingId(null);
            setPlayingId(track.trackId);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingId(null);
    };

    // Render current music card
    if (currentMusic && !showSearch) {
        const analysis = currentMusic.analysis;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#FDF0F1] rounded-[40px] p-6 shadow-md"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[#3E3229] font-bold flex items-center gap-2">
                        <Music className="w-5 h-5 text-[#CD6E67]" />
                        Vibe Match
                    </h3>
                    <button
                        onClick={() => setShowSearch(true)}
                        className="text-sm text-[#CD6E67] font-bold hover:underline"
                    >
                        Change song
                    </button>
                </div>

                {/* Vinyl Card */}
                <div
                    className="rounded-[30px] p-5 relative overflow-hidden"
                    style={{ backgroundColor: analysis?.color || '#CD6E67' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20 shadow-lg"
                            >
                                <img
                                    src={currentMusic.cover}
                                    alt={currentMusic.song}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-white/30" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">{currentMusic.song}</p>
                            <p className="text-white/70 text-sm truncate">{currentMusic.artist}</p>
                            {analysis && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold">
                                        {analysis.mood}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vibe Analysis */}
                    {analysis && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {analysis.keywords.map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-white/20 rounded-full text-white text-xs font-semibold"
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                            <p className="text-white/90 text-sm italic leading-relaxed">
                                "{analysis.description}"
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    }

    // Render search/empty state
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#FDF0F1] rounded-[40px] p-6 shadow-md"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#3E3229] font-bold flex items-center gap-2">
                    <Music className="w-5 h-5 text-[#CD6E67]" />
                    Vibe Match
                </h3>
                {showSearch && (
                    <button
                        onClick={() => {
                            setShowSearch(false);
                            setQuery('');
                            setResults([]);
                            stopAudio();
                        }}
                        className="p-1 text-[#7A6862] hover:text-[#3E3229] rounded-full hover:bg-[#ECC8CD] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!showSearch ? (
                // Empty state
                <button
                    onClick={() => setShowSearch(true)}
                    className="w-full py-10 border-2 border-dashed border-[#CD6E67]/30 rounded-[30px] hover:border-[#CD6E67] hover:bg-white transition-all group"
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-[#CD6E67]/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#CD6E67]/20 transition-all">
                            <Music className="w-8 h-8 text-[#CD6E67]" />
                        </div>
                        <div className="text-center">
                            <p className="text-[#3E3229] font-bold">Add your favorite song</p>
                            <p className="text-[#7A6862] text-sm mt-1 font-semibold">
                                AI will analyze your vibe through music
                            </p>
                        </div>
                    </div>
                </button>
            ) : (
                // Search UI
                <div>
                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6862]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Search for a song..."
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-full text-[#3E3229] placeholder-[#7A6862] font-semibold focus:outline-none focus:border-[#CD6E67] transition-colors shadow-sm"
                            autoFocus
                        />
                        {searching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#CD6E67] animate-spin" />
                        )}
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {results.map((track) => (
                            <motion.div
                                key={track.trackId}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 bg-white rounded-[20px] hover:shadow-md transition-all"
                            >
                                {/* Album Cover */}
                                <div className="relative w-14 h-14 rounded-[15px] overflow-hidden shadow-sm">
                                    <img
                                        src={track.coverUrl}
                                        alt={track.songName}
                                        className="w-full h-full object-cover"
                                    />
                                    {track.previewUrl && (
                                        <button
                                            onClick={() => togglePlay(track)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            {playingId === track.trackId ? (
                                                <Pause className="w-6 h-6 text-white" />
                                            ) : (
                                                <Play className="w-6 h-6 text-white" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[#3E3229] font-bold truncate">{track.songName}</p>
                                    <p className="text-[#7A6862] text-sm truncate font-semibold">{track.artistName}</p>
                                </div>

                                {/* Select Button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSelectTrack(track)}
                                    disabled={setting || !track.previewUrl}
                                    className="px-4 py-2 bg-[#CD6E67] hover:bg-[#B55B55] disabled:bg-[#ECC8CD] disabled:cursor-not-allowed text-white text-sm font-bold rounded-full transition-colors flex items-center gap-1 shadow-md"
                                >
                                    {setting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Select
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        ))}

                        {query && !searching && results.length === 0 && (
                            <div className="text-center py-8 text-[#7A6862] font-semibold">
                                No songs found
                            </div>
                        )}

                        {!query && (
                            <div className="text-center py-8 text-[#7A6862]">
                                <p className="font-semibold">Enter song or artist name</p>
                                <p className="text-sm mt-2">
                                    Example: "Shape of You", "Ed Sheeran"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
