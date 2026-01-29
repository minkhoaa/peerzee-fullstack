'use client';

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessageProps {
    audioUrl: string;
    duration?: number;
    isOwn?: boolean;
}

/**
 * AudioMessage - Renders audio messages with waveform and play button
 * Minimalist Notion-style design
 */
export default function AudioMessage({ audioUrl, duration = 0, isOwn }: AudioMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [loadedDuration, setLoadedDuration] = useState<number>(duration);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const total = audioRef.current.duration;
        setCurrentTime(current);
        // Update loadedDuration if we get a valid duration
        if (isFinite(total) && total > 0 && loadedDuration === 0) {
            setLoadedDuration(total);
        }
        setProgress(isFinite(total) && total > 0 ? (current / total) * 100 : 0);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        audioRef.current.currentTime = percentage * (audioRef.current.duration || duration);
    };

    const formatTime = (seconds: number) => {
        // Handle NaN and Infinity
        if (!isFinite(seconds) || isNaN(seconds)) {
            return '0:00';
        }
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Generate fake waveform bars (in production, extract from audio)
    const waveformBars = Array(20).fill(0).map(() => 0.3 + Math.random() * 0.7);

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl max-w-[280px] border-2 border-cocoa ${isOwn
            ? 'bg-pixel-pink/20'
            : 'bg-retro-paper'
            }`}>
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={() => {
                    if (audioRef.current && isFinite(audioRef.current.duration)) {
                        setLoadedDuration(audioRef.current.duration);
                    }
                }}
            />

            {/* Play button */}
            <button
                onClick={togglePlay}
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-colors border-2 border-cocoa shadow-pixel-sm active:translate-y-0.5 active:shadow-none ${isOwn
                    ? 'bg-pixel-pink text-cocoa hover:bg-pixel-pink-dark'
                    : 'bg-pixel-blue text-cocoa hover:bg-pixel-blue/80'
                    }`}
            >
                {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
            </button>

            {/* Waveform + Duration */}
            <div className="flex-1 flex flex-col gap-1">
                {/* Waveform */}
                <div
                    className="flex items-center gap-px h-6 cursor-pointer"
                    onClick={handleSeek}
                >
                    {waveformBars.map((height, i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-full transition-colors ${(i / waveformBars.length) * 100 <= progress
                                ? (isOwn ? 'bg-pixel-pink' : 'bg-cocoa')
                                : 'bg-cocoa-light/50'
                                }`}
                            style={{ height: `${height * 24}px` }}
                        />
                    ))}
                </div>

                {/* Time */}
                <div className="flex items-center justify-between text-xs text-cocoa-light font-medium">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        <span>{formatTime(duration || (audioRef.current?.duration || 0))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
