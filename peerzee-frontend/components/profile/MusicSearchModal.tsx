'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Loader2, Play, Pause, Sparkles, Music } from 'lucide-react';

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
    song: string;
    artist: string;
    cover: string;
    previewUrl?: string;
    analysis?: VibeAnalysis;
}

interface MusicSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMusicSet: (music: MusicData) => void;
}

export function MusicSearchModal({ isOpen, onClose, onMusicSet }: MusicSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MusicTrack[]>([]);
    const [searching, setSearching] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Stop audio when modal closes
    useEffect(() => {
        if (!isOpen) {
            stopAudio();
            setQuery('');
            setResults([]);
            setSelectedTrack(null);
            setImageErrors(new Set());
        }
    }, [isOpen]);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingId(null);
    };

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/profile/music/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
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

        // Debounce search (400ms)
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            handleSearch(value);
        }, 400);
    };

    const togglePlay = (track: MusicTrack) => {
        if (!track.previewUrl) return;

        if (playingId === track.trackId) {
            stopAudio();
        } else {
            stopAudio();
            audioRef.current = new Audio(track.previewUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.onended = () => setPlayingId(null);
            audioRef.current.onerror = () => setPlayingId(null);
            audioRef.current.play().catch(() => setPlayingId(null));
            setPlayingId(track.trackId);
        }
    };

    const handleImageError = (trackId: string) => {
        setImageErrors((prev) => new Set(prev).add(trackId));
    };

    const handleSelectTrack = async (track: MusicTrack) => {
        if (!track.previewUrl) {
            alert('Bài hát này không có preview để phân tích');
            return;
        }

        setSelectedTrack(track);
        setAnalyzing(true);
        stopAudio();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/profile/music`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        songName: track.songName,
                        artistName: track.artistName,
                        previewUrl: track.previewUrl,
                        coverUrl: track.coverUrl,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error('Failed to analyze music');
            }

            const data = await res.json();

            onMusicSet({
                song: track.songName,
                artist: track.artistName,
                cover: track.coverUrl,
                previewUrl: track.previewUrl,
                analysis: data.analysis,
            });

            onClose();
        } catch (err) {
            console.error('Failed to set music:', err);
            alert('Không thể phân tích bài hát. Vui lòng thử lại!');
        } finally {
            setAnalyzing(false);
            setSelectedTrack(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur - Darker for focus */}
            <div 
                className="absolute inset-0 backdrop-blur-sm bg-black/10"
                onClick={onClose}
            />
            
            {/* Modal Container - Dreamy Glass */}
            <div className="relative bg-white/80 backdrop-blur-2xl rounded-[32px] w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white shadow-rose-500/10">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/30 flex-shrink-0">
                    <h2 className="text-zinc-900 font-semibold flex items-center gap-2">
                        <Music className="w-5 h-5 text-rose-500" />
                        Chọn Bài Hát
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b border-white/30 flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Tìm bài hát hoặc nghệ sĩ..."
                            className="w-full pl-12 pr-12 py-3.5 bg-white/50 border border-white/50 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200/50 focus:bg-white transition-all text-base"
                            autoFocus
                        />
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                                <span className="text-rose-500 text-xs">Đang tìm...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Container */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Analyzing Overlay */}
                    {analyzing && selectedTrack && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center z-10">
                            <div className="w-24 h-24 rounded-xl overflow-hidden mb-6 shadow-2xl animate-pulse ring-4 ring-rose-500/30">
                                {!imageErrors.has(selectedTrack.trackId) ? (
                                    <img
                                        src={selectedTrack.coverUrl}
                                        alt={selectedTrack.songName}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(selectedTrack.trackId)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <Music className="w-10 h-10 text-white" />
                                    </div>
                                )}
                            </div>
                            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
                            <p className="text-zinc-900 font-semibold text-lg">Đang phân tích vibe...</p>
                            <p className="text-zinc-600 text-sm mt-2 text-center px-4">
                                AI đang nghe &ldquo;{selectedTrack.songName}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="p-4 space-y-2">
                        {results.length > 0 && (
                            <p className="text-[#666] text-xs mb-2">Tìm thấy {results.length} bài hát</p>
                        )}
                        
                        {results.map((track) => {
                            // Debug log
                            console.log('Track data:', { 
                                id: track.trackId, 
                                song: track.songName, 
                                artist: track.artistName,
                                cover: track.coverUrl?.substring(0, 50)
                            });
                            
                            return (
                                <div
                                    key={track.trackId}
                                    className="flex items-center gap-3 p-3 bg-white/40 backdrop-blur-sm rounded-xl hover:bg-gradient-to-r hover:from-rose-50 hover:to-transparent border border-white/30 transition-all group"
                                >
                                    {/* Cover Art - Fixed Size */}
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-[#333]">
                                        {!imageErrors.has(track.trackId) && track.coverUrl ? (
                                            <img
                                                src={track.coverUrl}
                                                alt={track.songName || 'Cover'}
                                                className="w-full h-full object-cover"
                                                onError={() => handleImageError(track.trackId)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-green-500/50 to-emerald-600/50 flex items-center justify-center">
                                                <Music className="w-6 h-6 text-white/70" />
                                            </div>
                                        )}
                                        
                                        {/* Play overlay */}
                                        {track.previewUrl && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePlay(track);
                                                }}
                                                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {playingId === track.trackId ? (
                                                    <Pause className="w-5 h-5 text-white" />
                                                ) : (
                                                    <Play className="w-5 h-5 text-white ml-0.5" />
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Playing indicator */}
                                        {playingId === track.trackId && (
                                            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                                        )}
                                    </div>

                                    {/* Track Info - NO OVERFLOW HIDDEN */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-zinc-900 font-semibold text-sm mb-1 truncate">
                                            {track.songName || 'Unknown Song'}
                                        </div>
                                        <div className="text-zinc-600 text-xs truncate">
                                            {track.artistName || 'Unknown Artist'}
                                        </div>
                                        {track.genre && (
                                            <div className="text-zinc-500 text-[10px] truncate mt-0.5">
                                                {track.genre}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons - Right Side */}
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    {/* Play Button (Circular) */}
                                    {track.previewUrl && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePlay(track);
                                            }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                playingId === track.trackId
                                                    ? 'bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/30'
                                                    : 'bg-white/50 text-zinc-600 hover:bg-white hover:text-zinc-900 border border-white/50'
                                            }`}
                                        >
                                            {playingId === track.trackId ? (
                                                <Pause className="w-4 h-4" />
                                            ) : (
                                                <Play className="w-4 h-4 ml-0.5" />
                                            )}
                                        </button>
                                    )}
                                    
                                    {/* Select Button */}
                                    <button
                                        onClick={() => handleSelectTrack(track)}
                                        disabled={analyzing || !track.previewUrl}
                                        className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-rose-400 hover:scale-[1.02] active:scale-[0.98] disabled:from-zinc-300 disabled:to-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-500/30 transition-all flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Chọn
                                    </button>
                                </div>
                            </div>
                        );
                        })}
                    </div>

                    {/* Empty States */}
                    {!searching && query && results.length === 0 && (
                        <div className="text-center py-16 px-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/50 backdrop-blur-sm border border-white/50 flex items-center justify-center">
                                <Search className="w-8 h-8 text-zinc-400" />
                            </div>
                            <p className="text-zinc-900 font-medium">Không tìm thấy bài hát</p>
                            <p className="text-zinc-600 text-sm mt-1">
                                Thử tìm với từ khóa khác
                            </p>
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center">
                                <Music className="w-10 h-10 text-rose-500" />
                            </div>
                            <p className="text-zinc-900 font-semibold text-lg">🎵 Tìm vibe của bạn</p>
                            <p className="text-zinc-600 text-sm mt-2 max-w-xs mx-auto">
                                Tìm bài hát yêu thích và để AI phân tích vibe âm nhạc của bạn
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {['Sơn Tùng', 'Westlife', 'Lofi', 'K-Pop'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleQueryChange(suggestion)}
                                        className="px-3 py-1.5 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 text-zinc-700 hover:text-zinc-900 text-xs rounded-full transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/30 bg-white/60 backdrop-blur-md flex-shrink-0">
                    <p className="text-zinc-600 text-xs text-center">
                        💡 AI sẽ nghe preview bài hát để phân tích &ldquo;Vibe&rdquo; của bạn
                    </p>
                </div>
            </div>
        </div>
    );
}
