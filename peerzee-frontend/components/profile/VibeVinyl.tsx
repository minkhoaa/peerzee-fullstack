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
                    className="w-full rounded-2xl border-2 border-dashed border-[#404040] hover:border-[#606060] bg-[#1A1A1A] hover:bg-[#202020] transition-all group cursor-pointer"
                >
                    <div className={`${config.padding} flex flex-col items-center justify-center`}>
                        {/* Empty vinyl placeholder */}
                        <div
                            className="rounded-full border-2 border-dashed border-[#404040] group-hover:border-[#606060] flex items-center justify-center mb-4 transition-colors"
                            style={{ width: config.vinyl, height: config.vinyl }}
                        >
                            <div className="w-1/3 h-1/3 rounded-full bg-[#252525] flex items-center justify-center">
                                <Plus className="w-1/2 h-1/2 text-[#666] group-hover:text-[#999] transition-colors" />
                            </div>
                        </div>
                        <p className={`text-[#9B9A97] font-medium ${config.text}`}>🎵 Add your Anthem</p>
                        <p className="text-[#666] text-xs mt-1">Chọn bài hát đại diện cho bạn</p>
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
                className={`rounded-2xl ${config.padding} relative overflow-hidden`}
                style={{
                    background: `linear-gradient(145deg, ${vibeColor}22 0%, ${vibeColor}08 100%)`,
                    border: `1px solid ${vibeColor}33`,
                    boxShadow: `0 0 40px ${vibeColor}22, inset 0 1px 0 ${vibeColor}22`,
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
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A1A1A]/90 flex items-center justify-center backdrop-blur-sm"
                                style={{
                                    width: config.center,
                                    height: config.center,
                                    border: `2px solid ${vibeColor}`,
                                    boxShadow: `0 0 12px ${vibeColor}66`,
                                }}
                            >
                                {music.previewUrl && (
                                    isPlaying ? (
                                        <Pause className="w-1/2 h-1/2 text-white" />
                                    ) : (
                                        <Play className="w-1/2 h-1/2 text-white ml-0.5" />
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
                        <p className={`text-white font-bold truncate ${config.text}`}>
                            {music.song}
                        </p>
                        <p className={`text-white/60 truncate ${size === 'sm' ? 'text-[10px]' : 'text-xs'} mt-0.5`}>
                            {music.artist}
                        </p>

                        {/* Mood badge */}
                        {analysis && (
                            <div className="mt-2">
                                <span
                                    className="inline-flex px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                                    style={{
                                        backgroundColor: `${vibeColor}cc`,
                                        boxShadow: `0 2px 8px ${vibeColor}44`,
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
                    <div className="mt-4 pt-4 border-t border-white/10">
                        {/* Keywords */}
                        {analysis.keywords && analysis.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {analysis.keywords.slice(0, 5).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-md text-white/80 text-[11px] font-medium"
                                        style={{ backgroundColor: `${vibeColor}33` }}
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        {analysis.description && (
                            <p className="text-white/70 text-xs italic leading-relaxed line-clamp-2">
                                &ldquo;{analysis.description}&rdquo;
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
