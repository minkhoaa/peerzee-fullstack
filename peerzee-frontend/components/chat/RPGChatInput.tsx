'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Mic, Wand2, ArrowUp, X, MicOff, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { clsx } from 'clsx';

interface Message {
    id: string;
    body: string;
    sender_id: string;
}

interface RPGChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onFileSelect: (file: File) => void;
    onVoiceMessage: (blob: Blob, duration: number) => void;
    replyingTo: Message | null;
    onCancelReply: () => void;
    selectedFile: File | null;
    previewUrl: string | null;
    onClearFile: () => void;
    disabled?: boolean;
    userId?: string | null;
    conversationId?: string | null;
}

/**
 * RPGChatInput - Pixel RPG styled chat input
 * Features: Pixel border, retro icons, AI suggestions, voice recording
 */
export default function RPGChatInput({
    value,
    onChange,
    onSend,
    onFileSelect,
    onVoiceMessage,
    replyingTo,
    onCancelReply,
    selectedFile,
    previewUrl,
    onClearFile,
    disabled,
    userId,
    conversationId,
}: RPGChatInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    // AI Suggestions state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [lastSuggestionTime, setLastSuggestionTime] = useState(0);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    // Voice recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onVoiceMessage(blob, recordingTime);
                stream.getTracks().forEach(track => track.stop());
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            setRecordingTime(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() && !selectedFile) return;
        onSend();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Fetch AI suggestions
    const fetchSuggestions = async () => {
        if (!conversationId) {
            setSuggestionError('No conversation selected');
            return;
        }

        const now = Date.now();
        if (now - lastSuggestionTime < 10000) {
            const waitTime = Math.ceil((10000 - (now - lastSuggestionTime)) / 1000);
            setSuggestionError(`Wait ${waitTime}s more`);
            return;
        }

        setLoadingSuggestions(true);
        setSuggestionError(null);
        setShowSuggestions(true);

        try {
            const response = await chatApi.suggestReply(conversationId);
            setSuggestions(response.data.suggestions);
            setLastSuggestionTime(Date.now());
        } catch (error: unknown) {
            console.error('Failed to fetch suggestions:', error);
            const errorMessage = error && typeof error === 'object' && 'response' in error
                ? (error.response as { data?: { message?: string } })?.data?.message || 'Cannot generate suggestions'
                : 'Cannot generate suggestions';
            setSuggestionError(errorMessage);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.ai-suggestions-container')) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="bg-white border-t-4 border-rpg-brown p-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,audio/*"
            />

            {/* Reply preview */}
            {replyingTo && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-rpg-blue/50 border-2 border-rpg-brown">
                    <div className="flex-1 border-l-2 border-primary pl-3">
                        <p className="text-xs font-display font-semibold text-rpg-brown">
                            ↩️ Replying to {replyingTo.sender_id === userId ? 'yourself' : 'message'}
                        </p>
                        <p className="text-xs text-rpg-brown/70 truncate font-display">
                            {replyingTo.body}
                        </p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 text-rpg-brown hover:bg-rpg-brown/10 border-2 border-transparent hover:border-rpg-brown transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Attachment preview */}
            {previewUrl && (
                <div className="relative mb-3 inline-block">
                    <img
                        src={previewUrl}
                        alt="Attachment"
                        className="max-h-32 border-2 border-rpg-brown"
                    />
                    <button
                        onClick={onClearFile}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white border-2 border-rpg-brown flex items-center justify-center font-display font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center justify-between mb-3 px-3 py-2 bg-red-50 border-2 border-red-400">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 animate-pulse" />
                        <span className="font-display text-sm text-red-600 font-medium">
                            🎤 Recording... {formatTime(recordingTime)}
                        </span>
                    </div>
                    <button
                        onClick={cancelRecording}
                        className="px-3 py-1 text-xs font-display font-bold text-red-600 hover:bg-red-100 border-2 border-red-400"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* AI Suggestions */}
            {showSuggestions && (
                <div className="ai-suggestions-container mb-3 p-3 bg-rpg-blue/30 border-2 border-rpg-brown">
                    <div className="flex items-center gap-2 mb-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-display font-bold text-rpg-brown">AI Suggestions</span>
                    </div>
                    
                    {loadingSuggestions ? (
                        <div className="flex items-center gap-2 py-2">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                            <span className="text-xs font-display text-rpg-brown/70">Generating ideas...</span>
                        </div>
                    ) : suggestionError ? (
                        <p className="text-xs font-display text-red-500">{suggestionError}</p>
                    ) : (
                        <div className="space-y-2">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left px-3 py-2 text-sm font-display text-rpg-brown bg-white border-2 border-rpg-brown hover:bg-primary-light transition-colors shadow-pixel-sm hover:shadow-none active:translate-y-[2px]"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-3">
                {/* Left actions */}
                <div className="flex gap-1">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                        className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all disabled:opacity-50"
                        title="Attach file"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={fetchSuggestions}
                        disabled={disabled || loadingSuggestions}
                        className="p-2 text-primary hover:bg-primary-light border-2 border-transparent hover:border-primary transition-all disabled:opacity-50"
                        title="AI Suggestions"
                    >
                        <Wand2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Text input */}
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        disabled={disabled || isRecording}
                        rows={1}
                        className={clsx(
                            'w-full px-4 py-3 font-display text-sm',
                            'border-2 border-rpg-brown',
                            'bg-white text-rpg-brown placeholder-rpg-brown/40',
                            'resize-none focus:outline-none',
                            'shadow-[inset_2px_2px_0_0_rgba(74,59,50,0.1)]',
                            'focus:shadow-[inset_2px_2px_0_0_rgba(74,59,50,0.1),0_0_0_2px_#f04285]',
                            'disabled:opacity-50 disabled:bg-rpg-blue/20'
                        )}
                    />
                </div>

                {/* Right actions */}
                <div className="flex gap-1">
                    {!value.trim() && !selectedFile && (
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={disabled}
                            className={clsx(
                                'p-2 border-2 transition-all disabled:opacity-50',
                                isRecording
                                    ? 'bg-red-500 text-white border-rpg-brown animate-pulse'
                                    : 'text-rpg-brown hover:bg-rpg-blue border-transparent hover:border-rpg-brown'
                            )}
                            title={isRecording ? 'Stop recording' : 'Voice message'}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}
                    
                    {/* Send button */}
                    <button
                        onClick={handleSubmit}
                        disabled={disabled || (!value.trim() && !selectedFile)}
                        className={clsx(
                            'p-2 border-2 border-rpg-brown transition-all',
                            'bg-primary text-white',
                            'shadow-[2px_2px_0_0_#4a3b32]',
                            'active:translate-y-[2px] active:shadow-none',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0'
                        )}
                        title="Send message"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
