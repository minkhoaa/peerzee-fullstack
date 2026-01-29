'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Music, Search, X, Loader2, Play, Pause, Award } from 'lucide-react';
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
            <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-cocoa font-pixel uppercase tracking-widest flex items-center gap-2">
                        <Music className="w-5 h-5 text-pixel-green" />
                        Vibe Match
                    </h3>
                    <button
                        onClick={() => setShowSearch(true)}
                        className="text-xs text-pixel-pink-dark hover:text-cocoa font-bold uppercase"
                    >
                        Đổi bài
                    </button>
                </div>

                {/* Vinyl Card */}
                <div
                    className="rounded-xl p-4 relative overflow-hidden border-2 border-cocoa"
                    style={{ backgroundColor: analysis?.color || '#C9B1FF' }}
                >
                    {/* Album Cover as Vinyl */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-3 border-cocoa shadow-pixel animate-spin-slow">
                                <img
                                    src={currentMusic.cover}
                                    alt={currentMusic.song}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full bg-cocoa/50" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-cocoa font-bold truncate">{currentMusic.song}</p>
                            <p className="text-cocoa/70 text-sm truncate font-medium">{currentMusic.artist}</p>
                            {analysis && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-cocoa rounded-sm text-retro-white text-xs font-bold border-2 border-cocoa">
                                        {analysis.mood}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vibe Analysis */}
                    {analysis && (
                        <div className="mt-4 pt-4 border-t border-cocoa/30">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {analysis.keywords.map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 bg-cocoa rounded-sm text-retro-white text-xs font-bold border-2 border-cocoa"
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                            <p className="text-cocoa/80 text-sm italic leading-relaxed font-medium">
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
        <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-cocoa font-pixel uppercase tracking-widest flex items-center gap-2">
                    <Music className="w-5 h-5 text-pixel-green" />
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
                        className="text-cocoa-light hover:text-cocoa p-1.5 rounded-lg border-2 border-transparent hover:border-cocoa hover:bg-pixel-red/20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {!showSearch ? (
                // Empty state
                <button
                    onClick={() => setShowSearch(true)}
                    className="w-full py-8 border-3 border-dashed border-cocoa-light rounded-xl hover:border-pixel-green transition-colors group bg-retro-paper"
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-pixel-green flex items-center justify-center group-hover:scale-110 transition-transform border-2 border-cocoa shadow-pixel-sm">
                            <Music className="w-8 h-8 text-cocoa" />
                        </div>
                        <div className="text-center">
                            <p className="text-cocoa font-bold">Thêm bài hát yêu thích</p>
                            <p className="text-cocoa-light text-sm mt-1 font-medium">
                                AI sẽ phân tích vibe của bạn qua âm nhạc
                            </p>
                        </div>
                    </div>
                </button>
            ) : (
                // Search UI
                <div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Tìm bài hát..."
                            className="w-full pl-10 pr-4 py-3 bg-retro-paper border-2 border-cocoa rounded-xl text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-green font-bold shadow-pixel-inset"
                            autoFocus
                        />
                        {searching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pixel-green animate-spin" />
                        )}
                    </div>

                    {/* Results */}
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {results.map((track) => (
                            <div
                                key={track.trackId}
                                className="flex items-center gap-3 p-3 bg-retro-paper rounded-xl hover:bg-pixel-green/20 transition-colors border-2 border-cocoa"
                            >
                                {/* Album Cover */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-cocoa">
                                    <img
                                        src={track.coverUrl}
                                        alt={track.songName}
                                        className="w-full h-full object-cover"
                                    />
                                    {track.previewUrl && (
                                        <button
                                            onClick={() => togglePlay(track)}
                                            className="absolute inset-0 flex items-center justify-center bg-cocoa/50 opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                            {playingId === track.trackId ? (
                                                <Pause className="w-5 h-5 text-retro-white" />
                                            ) : (
                                                <Play className="w-5 h-5 text-retro-white" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-cocoa font-bold truncate">{track.songName}</p>
                                    <p className="text-cocoa-light text-sm truncate font-medium">{track.artistName}</p>
                                </div>

                                {/* Select Button */}
                                <button
                                    onClick={() => handleSelectTrack(track)}
                                    disabled={setting || !track.previewUrl}
                                    className="px-3 py-1.5 bg-pixel-green hover:bg-pixel-green/80 disabled:bg-cocoa-light/30 disabled:cursor-not-allowed text-cocoa text-sm font-bold rounded-lg transition-colors flex items-center gap-1 border-2 border-cocoa shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                                >
                                    {setting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Award className="w-4 h-4" strokeWidth={2.5} />
                                            Chọn
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}

                        {query && !searching && results.length === 0 && (
                            <div className="text-center py-8 text-cocoa-light font-medium">
                                Không tìm thấy bài hát nào
                            </div>
                        )}

                        {!query && (
                            <div className="text-center py-8 text-cocoa-light">
                                <p className="font-medium">Nhập tên bài hát hoặc nghệ sĩ</p>
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
