'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music, Plus } from 'lucide-react';

interface VibeAnalysis {
    mood: string;
    color: string;
    keywords: string[];
    description: string;
}

interface MusicData {
    song: string;
    artist: string;
    cover?: string;
    previewUrl?: string;
    analysis?: VibeAnalysis;
}

interface VibeVinylProps {
    music: MusicData | null;
    size?: 'sm' | 'md' | 'lg';
    showDescription?: boolean;
    className?: string;
    onAddClick?: () => void;
}

export function VibeVinyl({ music, size = 'md', showDescription = true, className = '', onAddClick }: VibeVinylProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [imageError, setImageError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Size configurations
    const sizeConfig = {
        sm: { vinyl: 80, center: 24, text: 'text-xs', padding: 'p-3' },
        md: { vinyl: 120, center: 36, text: 'text-sm', padding: 'p-4' },
        lg: { vinyl: 160, center: 48, text: 'text-base', padding: 'p-5' },
    };

    const config = sizeConfig[size];

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Reset playing state when music changes
    useEffect(() => {
        setIsPlaying(false);
        setImageError(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }, [music?.song]);

    const togglePlay = () => {
        if (!music?.previewUrl) return;

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current) {
                audioRef.current = new Audio(music.previewUrl);
                audioRef.current.volume = 0.5;
                audioRef.current.onended = () => setIsPlaying(false);
                audioRef.current.onerror = () => setIsPlaying(false);
            }
            audioRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
        }
    };

    // Empty state - "Add your Anthem"
    if (!music) {
        return (
            <div className={`${className}`}>
                <button
                    onClick={onAddClick}
                    className="w-full rounded-xl border-3 border-dashed border-cocoa-light hover:border-pixel-green bg-retro-paper hover:bg-pixel-green/10 transition-all group cursor-pointer"
                >
                    <div className={`${config.padding} flex flex-col items-center justify-center`}>
                        {/* Empty vinyl placeholder */}
                        <div
                            className="rounded-xl border-3 border-dashed border-cocoa-light group-hover:border-pixel-green flex items-center justify-center mb-4 transition-colors"
                            style={{ width: config.vinyl, height: config.vinyl }}
                        >
                            <div className="w-1/3 h-1/3 rounded-lg bg-retro-white flex items-center justify-center border-2 border-cocoa">
                                <Plus className="w-1/2 h-1/2 text-cocoa-light group-hover:text-pixel-green transition-colors" />
                            </div>
                        </div>
                        <p className={`text-cocoa font-bold ${config.text}`}>🎵 Add your Anthem</p>
                        <p className="text-cocoa-light text-xs mt-1 font-medium">Chọn bài hát đại diện cho bạn</p>
                    </div>
                </button>
            </div>
        );
    }

    const analysis = music.analysis;
    const vibeColor = analysis?.color || '#6C5CE7';

    return (
        <div className={`relative ${className}`}>
            {/* Outer Glow - Soft drop shadow */}
            <div
                className="absolute inset-0 rounded-2xl blur-3xl opacity-30 -z-10 scale-110"
                style={{ backgroundColor: vibeColor }}
            />

            {/* Main Container */}
            <div
                className={`rounded-xl ${config.padding} relative overflow-hidden border-3 border-cocoa shadow-pixel bg-retro-white`}
                style={{
                    background: `linear-gradient(145deg, ${vibeColor}22 0%, ${vibeColor}08 100%)`,
                }}
            >
                <div className="flex items-center gap-4">
                    {/* Vinyl Record with Framer Motion */}
                    <div className="relative flex-shrink-0">
                        <motion.div
                            className="rounded-full relative overflow-hidden cursor-pointer"
                            style={{
                                width: config.vinyl,
                                height: config.vinyl,
                                boxShadow: `0 8px 32px ${vibeColor}44`,
                            }}
                            onClick={togglePlay}
                            animate={{ rotate: isPlaying ? 360 : 0 }}
                            transition={{
                                repeat: isPlaying ? Infinity : 0,
                                duration: 10,
                                ease: 'linear',
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Album cover as vinyl surface */}
                            {music.cover && !imageError ? (
                                <img
                                    src={music.cover}
                                    alt={music.song}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center"
                                    style={{ background: `linear-gradient(135deg, ${vibeColor} 0%, ${vibeColor}88 100%)` }}
                                >
                                    <Music className="w-1/2 h-1/2 text-white/60" />
                                </div>
                            )}

                            {/* Vinyl grooves overlay */}
                            <div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                    background: `repeating-radial-gradient(
                                        circle at center,
                                        transparent 0px,
                                        transparent 3px,
                                        rgba(0,0,0,0.08) 3px,
                                        rgba(0,0,0,0.08) 4px
                                    )`,
                                }}
                            />

                            {/* Center hole with play/pause */}
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-retro-white/90 flex items-center justify-center backdrop-blur-sm border-2 border-cocoa"
                                style={{
                                    width: config.center,
                                    height: config.center,
                                }}
                            >
                                {music.previewUrl && (
                                    isPlaying ? (
                                        <Pause className="w-1/2 h-1/2 text-cocoa" />
                                    ) : (
                                        <Play className="w-1/2 h-1/2 text-cocoa ml-0.5" />
                                    )
                                )}
                            </div>
                        </motion.div>

                        {/* Playing pulse ring */}
                        {isPlaying && (
                            <motion.div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ border: `2px solid ${vibeColor}` }}
                                animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                        )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-cocoa font-bold truncate ${config.text}`}>
                            {music.song}
                        </p>
                        <p className={`text-cocoa-light truncate ${size === 'sm' ? 'text-[10px]' : 'text-xs'} mt-0.5 font-medium`}>
                            {music.artist}
                        </p>

                        {/* Mood badge */}
                        {analysis && (
                            <div className="mt-2">
                                <span
                                    className="inline-flex px-2.5 py-1 rounded-lg text-cocoa text-xs font-bold border-2 border-cocoa"
                                    style={{
                                        backgroundColor: `${vibeColor}cc`,
                                    }}
                                >
                                    {analysis.mood}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Keywords & Description */}
                {showDescription && analysis && (
                    <div className="mt-4 pt-4 border-t-2 border-cocoa/30">
                        {/* Keywords */}
                        {analysis.keywords && analysis.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {analysis.keywords.slice(0, 5).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-lg text-cocoa text-[11px] font-bold border border-cocoa"
                                        style={{ backgroundColor: `${vibeColor}33` }}
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        {analysis.description && (
                            <p className="text-cocoa/80 text-xs italic leading-relaxed line-clamp-2 font-medium">
                                &ldquo;{analysis.description}&rdquo;
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
