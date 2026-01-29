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

    // Empty state - "Add your Anthem" with ToyWorld theme
    if (!music) {
        return (
            <div className={`${className}`}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddClick}
                    className="w-full rounded-[30px] border-2 border-dashed border-[#ECC8CD] hover:border-[#CD6E67]/60 bg-white hover:bg-[#FDF0F1] transition-all group cursor-pointer shadow-lg shadow-[#ECC8CD]/20"
                >
                    <div className={`${config.padding} flex flex-col items-center justify-center py-6`}>
                        {/* Empty vinyl placeholder */}
                        <div
                            className="rounded-full border-2 border-dashed border-[#ECC8CD] group-hover:border-[#CD6E67]/60 flex items-center justify-center mb-4 transition-colors bg-[#FDF0F1]"
                            style={{ width: config.vinyl, height: config.vinyl }}
                        >
                            <div className="w-1/3 h-1/3 rounded-full bg-[#ECC8CD]/50 flex items-center justify-center">
                                <Plus className="w-1/2 h-1/2 text-[#CD6E67] group-hover:text-[#B85C55] transition-colors" />
                            </div>
                        </div>
                        <p className={`text-[#3E3229] font-nunito font-bold ${config.text}`}>🎵 Add your Anthem</p>
                        <p className="text-[#7A6862] text-xs mt-1">Chọn bài hát đại diện cho bạn</p>
                    </div>
                </motion.button>
            </div>
        );
    }

    const analysis = music.analysis;
    const vibeColor = analysis?.color || '#CD6E67';

    return (
        <div className={`relative ${className}`}>
            {/* Outer Glow - Soft drop shadow */}
            <div
                className="absolute inset-0 rounded-[30px] blur-3xl opacity-20 -z-10 scale-110"
                style={{ backgroundColor: vibeColor }}
            />

            {/* Main Container - ToyWorld styled */}
            <div
                className={`rounded-[30px] ${config.padding} relative overflow-hidden bg-white border-2 shadow-lg`}
                style={{
                    borderColor: `${vibeColor}44`,
                    boxShadow: `0 8px 32px ${vibeColor}22`,
                }}
            >
                <div className="flex items-center gap-4">
                    {/* Vinyl Record with Framer Motion */}
                    <div className="relative flex-shrink-0">
                        <motion.div
                            className="rounded-full relative overflow-hidden cursor-pointer border-4"
                            style={{
                                width: config.vinyl,
                                height: config.vinyl,
                                borderColor: `${vibeColor}44`,
                                boxShadow: `0 8px 24px ${vibeColor}33`,
                            }}
                            onClick={togglePlay}
                            animate={{ rotate: isPlaying ? 360 : 0 }}
                            transition={{
                                repeat: isPlaying ? Infinity : 0,
                                duration: 10,
                                ease: 'linear',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                                    <Music className="w-1/2 h-1/2 text-white/80" />
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
                                        rgba(0,0,0,0.06) 3px,
                                        rgba(0,0,0,0.06) 4px
                                    )`,
                                }}
                            />

                            {/* Center hole with play/pause - ToyWorld styled */}
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 flex items-center justify-center backdrop-blur-sm"
                                style={{
                                    width: config.center,
                                    height: config.center,
                                    border: `3px solid ${vibeColor}`,
                                    boxShadow: `0 0 12px ${vibeColor}44`,
                                }}
                            >
                                {music.previewUrl && (
                                    isPlaying ? (
                                        <Pause className="w-1/2 h-1/2" style={{ color: vibeColor }} />
                                    ) : (
                                        <Play className="w-1/2 h-1/2 ml-0.5" style={{ color: vibeColor }} />
                                    )
                                )}
                            </div>
                        </motion.div>

                        {/* Playing pulse ring */}
                        {isPlaying && (
                            <motion.div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ border: `3px solid ${vibeColor}` }}
                                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            />
                        )}
                    </div>

                    {/* Track Info - ToyWorld styled */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-[#3E3229] font-nunito font-bold truncate ${config.text}`}>
                            {music.song}
                        </p>
                        <p className={`text-[#7A6862] truncate ${size === 'sm' ? 'text-[10px]' : 'text-xs'} mt-0.5`}>
                            {music.artist}
                        </p>

                        {/* Mood badge - candy styled */}
                        {analysis && (
                            <div className="mt-2">
                                <span
                                    className="inline-flex px-3 py-1 rounded-full text-white text-xs font-bold border-b-2"
                                    style={{
                                        backgroundColor: vibeColor,
                                        borderBottomColor: `${vibeColor}88`,
                                        boxShadow: `0 4px 12px ${vibeColor}44`,
                                    }}
                                >
                                    {analysis.mood}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Keywords & Description - ToyWorld styled */}
                {showDescription && analysis && (
                    <div className="mt-4 pt-4 border-t-2 border-[#ECC8CD]/30">
                        {/* Keywords as candy tags */}
                        {analysis.keywords && analysis.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {analysis.keywords.slice(0, 5).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-full text-[11px] font-semibold border-b-2"
                                        style={{ 
                                            backgroundColor: `${vibeColor}22`,
                                            color: vibeColor,
                                            borderBottomColor: `${vibeColor}33`,
                                        }}
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description */}
                        {analysis.description && (
                            <p className="text-[#7A6862] text-xs italic leading-relaxed line-clamp-2">
                                &ldquo;{analysis.description}&rdquo;
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
