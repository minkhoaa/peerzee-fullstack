'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Send, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
    onSendAudio: (blob: Blob, duration: number) => Promise<void>;
    disabled?: boolean;
}

/**
 * VoiceRecorder - Microphone button for recording voice messages
 * Uses MediaRecorder API, shows waveform visualization
 */
export default function VoiceRecorder({ onSendAudio, disabled }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioLevels, setAudioLevels] = useState<number[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Visualize audio levels
    const visualize = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Sample 8 frequency bands for visualization
        const bands = 8;
        const bandSize = Math.floor(dataArray.length / bands);
        const levels = [];
        for (let i = 0; i < bands; i++) {
            let sum = 0;
            for (let j = 0; j < bandSize; j++) {
                sum += dataArray[i * bandSize + j];
            }
            levels.push(sum / bandSize / 255); // Normalize to 0-1
        }
        setAudioLevels(levels);

        if (isRecording) {
            animationRef.current = requestAnimationFrame(visualize);
        }
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup audio analysis
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Setup media recorder
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);
            startTimeRef.current = Date.now();

            // Update duration
            intervalRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);

            // Start visualization
            visualize();
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };

    const stopRecording = async () => {
        if (!mediaRecorderRef.current || !isRecording) return;

        setIsPending(true);

        return new Promise<void>((resolve) => {
            mediaRecorderRef.current!.onstop = async () => {
                // Stop all tracks
                mediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());

                // Clear interval
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }

                // Cancel animation
                if (animationRef.current) {
                    cancelAnimationFrame(animationRef.current);
                    animationRef.current = null;
                }

                // Create blob
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);

                try {
                    await onSendAudio(audioBlob, finalDuration);
                } catch (error) {
                    console.error('Failed to send audio:', error);
                }

                setIsRecording(false);
                setIsPending(false);
                setDuration(0);
                setAudioLevels([]);
                resolve();
            };

            mediaRecorderRef.current!.stop();
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isRecording) {
        return (
            <div className="flex items-center gap-3 px-3 py-2 bg-pixel-red/20 border-2 border-pixel-red rounded-xl">
                {/* Waveform */}
                <div className="flex items-center gap-0.5 h-8">
                    {audioLevels.length > 0 ? (
                        audioLevels.map((level, i) => (
                            <div
                                key={i}
                                className="w-1 bg-pixel-red rounded-full transition-all duration-75"
                                style={{ height: `${Math.max(4, level * 28)}px` }}
                            />
                        ))
                    ) : (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="w-1 h-1 bg-pixel-red rounded-full animate-pulse" />
                        ))
                    )}
                </div>

                {/* Duration */}
                <span className="text-sm text-pixel-red font-pixel min-w-[40px]">
                    {formatDuration(duration)}
                </span>

                {/* Stop & Send button */}
                <button
                    onClick={stopRecording}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-pixel-red text-retro-white rounded-lg border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-red/80 disabled:opacity-50 transition-colors active:translate-y-0.5 active:shadow-none"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Square className="w-3 h-3 fill-current" />
                            <Send className="w-3 h-3" />
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={startRecording}
            disabled={disabled}
            className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-pink/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors disabled:opacity-50"
            title="Record voice message"
        >
            <Mic className="w-5 h-5" />
        </button>
    );
}
