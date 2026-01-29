'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Loader2, Play, Pause, Award, Music } from 'lucide-react';
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
            const { data } = await profileApi.setMusic({
                song: track.songName,
                artist: track.artistName,
                previewUrl: track.previewUrl,
                cover: track.coverUrl,
            });

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
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-cocoa/50"
                onClick={onClose}
            />
            
            {/* Modal Container - Pixel Style */}
            <div className="relative bg-retro-white rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col border-3 border-cocoa shadow-pixel-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b-2 border-cocoa flex-shrink-0">
                    <h2 className="text-cocoa font-pixel uppercase tracking-widest flex items-center gap-2">
                        <Music className="w-5 h-5 text-pixel-green" />
                        Chọn Bài Hát
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-red/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 border-b-2 border-cocoa flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Tìm bài hát hoặc nghệ sĩ..."
                            className="w-full pl-12 pr-12 py-3.5 bg-retro-paper border-2 border-cocoa rounded-xl text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-green font-bold shadow-pixel-inset transition-all text-base"
                            autoFocus
                        />
                        {searching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Loader2 className="w-5 h-5 text-pixel-green animate-spin" />
                                <span className="text-pixel-green text-xs font-bold">Đang tìm...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Container */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Analyzing Overlay */}
                    {analyzing && selectedTrack && (
                        <div className="absolute inset-0 bg-retro-white/95 flex flex-col items-center justify-center z-10">
                            <div className="w-24 h-24 rounded-xl overflow-hidden mb-6 shadow-pixel animate-pulse border-3 border-cocoa">
                                {!imageErrors.has(selectedTrack.trackId) ? (
                                    <img
                                        src={selectedTrack.coverUrl}
                                        alt={selectedTrack.songName}
                                        className="w-full h-full object-cover"
                                        onError={() => handleImageError(selectedTrack.trackId)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-pixel-green flex items-center justify-center">
                                        <Music className="w-10 h-10 text-cocoa" />
                                    </div>
                                )}
                            </div>
                            <Loader2 className="w-8 h-8 text-pixel-green animate-spin mb-4" />
                            <p className="text-cocoa font-pixel uppercase tracking-widest text-lg">Đang phân tích vibe...</p>
                            <p className="text-cocoa-light text-sm mt-2 text-center px-4 font-medium">
                                AI đang nghe &ldquo;{selectedTrack.songName}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="p-4 space-y-2">
                        {results.length > 0 && (
                            <p className="text-cocoa-light text-xs mb-2 font-medium">Tìm thấy {results.length} bài hát</p>
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
                                    className="flex items-center gap-3 p-3 bg-retro-paper rounded-xl hover:bg-pixel-green/20 border-2 border-cocoa transition-all group"
                                >
                                    {/* Cover Art - Fixed Size */}
                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-cocoa-light/20 border-2 border-cocoa">
                                        {!imageErrors.has(track.trackId) && track.coverUrl ? (
                                            <img
                                                src={track.coverUrl}
                                                alt={track.songName || 'Cover'}
                                                className="w-full h-full object-cover"
                                                onError={() => handleImageError(track.trackId)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-pixel-green/50 flex items-center justify-center">
                                                <Music className="w-6 h-6 text-cocoa" />
                                            </div>
                                        )}
                                        
                                        {/* Play overlay */}
                                        {track.previewUrl && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePlay(track);
                                                }}
                                                className="absolute inset-0 flex items-center justify-center bg-cocoa/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {playingId === track.trackId ? (
                                                    <Pause className="w-5 h-5 text-retro-white" />
                                                ) : (
                                                    <Play className="w-5 h-5 text-retro-white ml-0.5" />
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Playing indicator */}
                                        {playingId === track.trackId && (
                                            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-pixel-green animate-pulse" />
                                        )}
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-cocoa font-bold text-sm mb-1 truncate">
                                            {track.songName || 'Unknown Song'}
                                        </div>
                                        <div className="text-cocoa-light text-xs truncate font-medium">
                                            {track.artistName || 'Unknown Artist'}
                                        </div>
                                        {track.genre && (
                                            <div className="text-cocoa-light/70 text-[10px] truncate mt-0.5">
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
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border-2 border-cocoa ${
                                                playingId === track.trackId
                                                    ? 'bg-pixel-green text-cocoa shadow-pixel-sm'
                                                    : 'bg-retro-white text-cocoa hover:bg-pixel-blue/30'
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
                                        className="px-3 py-1.5 bg-pixel-pink hover:bg-pixel-pink-dark disabled:bg-cocoa-light/30 disabled:text-cocoa-light disabled:cursor-not-allowed text-cocoa text-xs font-bold rounded-lg border-2 border-cocoa shadow-pixel-sm active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1"
                                    >
                                        <Award className="w-3 h-3" strokeWidth={2.5} />
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
                            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-retro-paper border-2 border-cocoa flex items-center justify-center">
                                <Search className="w-8 h-8 text-cocoa-light" />
                            </div>
                            <p className="text-cocoa font-bold">Không tìm thấy bài hát</p>
                            <p className="text-cocoa-light text-sm mt-1 font-medium">
                                Thử tìm với từ khóa khác
                            </p>
                        </div>
                    )}

                    {!query && (
                        <div className="text-center py-16 px-6">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-pixel-green/30 border-2 border-cocoa flex items-center justify-center">
                                <Music className="w-10 h-10 text-pixel-green" />
                            </div>
                            <p className="text-cocoa font-pixel uppercase tracking-widest text-lg">🎵 Tìm vibe của bạn</p>
                            <p className="text-cocoa-light text-sm mt-2 max-w-xs mx-auto font-medium">
                                Tìm bài hát yêu thích và để AI phân tích vibe âm nhạc của bạn
                            </p>
                            <div className="mt-6 flex flex-wrap justify-center gap-2">
                                {['Sơn Tùng', 'Westlife', 'Lofi', 'K-Pop'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleQueryChange(suggestion)}
                                        className="px-3 py-1.5 bg-pixel-yellow hover:bg-pixel-yellow/80 border-2 border-cocoa text-cocoa text-xs rounded-lg font-bold transition-all shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t-2 border-cocoa bg-retro-paper flex-shrink-0">
                    <p className="text-cocoa-light text-xs text-center font-medium">
                        💡 AI sẽ nghe preview bài hát để phân tích &ldquo;Vibe&rdquo; của bạn
                    </p>
                </div>
            </div>
        </div>
    );
}
