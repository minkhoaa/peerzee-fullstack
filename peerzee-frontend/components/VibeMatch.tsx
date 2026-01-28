'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, X, Loader2, Play, Pause, Sparkles } from 'lucide-react';
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

    // Cleanup audio on unmount
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

        // Debounce search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 500);
    };

    const handleSelectTrack = async (track: MusicTrack) => {
        if (!track.previewUrl) {
            alert('Bài hát này không có preview để phân tích');
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
            alert('Không thể phân tích bài hát. Vui lòng thử lại!');
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
            <div className="bg-[#1A1A1A] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Music className="w-5 h-5 text-green-500" />
                        Vibe Match
                    </h3>
                    <button
                        onClick={() => setShowSearch(true)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                    >
                        Đổi bài
                    </button>
                </div>

                {/* Vinyl Card */}
                <div
                    className="rounded-xl p-4 relative overflow-hidden"
                    style={{ backgroundColor: analysis?.color || '#6C5CE7' }}
                >
                    {/* Album Cover as Vinyl */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-black/20 shadow-lg animate-spin-slow">
                                <img
                                    src={currentMusic.cover}
                                    alt={currentMusic.song}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-black/50" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold truncate">{currentMusic.song}</p>
                            <p className="text-white/70 text-sm truncate">{currentMusic.artist}</p>
                            {analysis && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-white text-xs font-medium">
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
                                        className="px-2 py-1 bg-white/20 rounded-lg text-white text-xs"
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                            <p className="text-white/80 text-sm italic leading-relaxed">
                                "{analysis.description}"
                            </p>
                        </div>
                    )}
                </div>

                <style jsx>{`
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-slow {
                        animation: spin-slow 8s linear infinite;
                    }
                `}</style>
            </div>
        );
    }

    // Render search/empty state
    return (
        <div className="bg-[#1A1A1A] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <Music className="w-5 h-5 text-green-500" />
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
                        className="text-[#9B9A97] hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!showSearch ? (
                // Empty state
                <button
                    onClick={() => setShowSearch(true)}
                    className="w-full py-8 border-2 border-dashed border-[#333] rounded-xl hover:border-green-500/50 transition-colors group"
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full from-green-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Music className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Thêm bài hát yêu thích</p>
                            <p className="text-[#9B9A97] text-sm mt-1">
                                AI sẽ phân tích vibe của bạn qua âm nhạc
                            </p>
                        </div>
                    </div>
                </button>
            ) : (
                // Search UI
                <div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9A97]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Tìm bài hát..."
                            className="w-full pl-10 pr-4 py-3 bg-[#252525] border border-[#333] rounded-xl text-white placeholder-[#9B9A97] focus:outline-none focus:border-green-500"
                            autoFocus
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-spin" />
                        )}
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {results.map((track) => (
                            <div
                                key={track.trackId}
                                className="flex items-center gap-3 p-3 bg-[#252525] rounded-xl hover:bg-[#303030] transition-colors"
                            >
                                {/* Album Cover */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden ">
                                    <img
                                        src={track.coverUrl}
                                        alt={track.songName}
                                        className="w-full h-full object-cover"
                                    />
                                    {track.previewUrl && (
                                        <button
                                            onClick={() => togglePlay(track)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            {playingId === track.trackId ? (
                                                <Pause className="w-5 h-5 text-white" />
                                            ) : (
                                                <Play className="w-5 h-5 text-white" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{track.songName}</p>
                                    <p className="text-[#9B9A97] text-sm truncate">{track.artistName}</p>
                                </div>

                                {/* Select Button */}
                                <button
                                    onClick={() => handleSelectTrack(track)}
                                    disabled={setting || !track.previewUrl}
                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-[#333] disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                                >
                                    {setting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Chọn
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}

                        {query && !searching && results.length === 0 && (
                            <div className="text-center py-8 text-[#9B9A97]">
                                Không tìm thấy bài hát nào
                            </div>
                        )}

                        {!query && (
                            <div className="text-center py-8 text-[#9B9A97]">
                                <p>Nhập tên bài hát hoặc nghệ sĩ</p>
                                <p className="text-xs mt-2">
                                    Ví dụ: "Có chắc yêu là đây", "Sơn Tùng"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
