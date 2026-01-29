'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Paperclip, Mic, Wand2, ArrowUp, X, MicOff, Loader2 } from 'lucide-react';
import { chatApi } from '@/lib/api';

interface Message {
    id: string;
    body: string;
    sender_id: string;
}

interface ChatInputProps {
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
 * ChatInput - Retro Pixel floating input with 8-bit design
 * Pixel borders, cocoa colors, fun aesthetic
 */
export default function ChatInput({
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
}: ChatInputProps) {
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
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [value]);

    // Handle file selection
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

            // Start timer
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

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim() && !selectedFile) return;
        onSend();
    };

    // Handle key press
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Fetch AI suggestions
    const fetchSuggestions = async () => {
        if (!conversationId) {
            setSuggestionError('Không có conversation');
            return;
        }

        // Rate limiting on client side too
        const now = Date.now();
        if (now - lastSuggestionTime < 10000) {
            const waitTime = Math.ceil((10000 - (now - lastSuggestionTime)) / 1000);
            setSuggestionError(`Đợi ${waitTime}s nữa nhé`);
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
                ? (error.response as { data?: { message?: string } })?.data?.message || 'Không thể tạo gợi ý'
                : 'Không thể tạo gợi ý';
            setSuggestionError(errorMessage);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: string) => {
        onChange(suggestion);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.suggestions-container')) {
                setShowSuggestions(false);
            }
        };
        if (showSuggestions) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSuggestions]);

    return (
        <div className="p-4 bg-retro-paper border-t-3 border-cocoa">
            {/* Reply Preview */}
            {replyingTo && (
                <div className="mb-3 mx-2 px-4 py-3 bg-retro-white border-2 border-cocoa rounded-lg shadow-pixel-sm flex items-center gap-3">
                    <div className="flex-1 min-w-0 border-l-3 border-pixel-pink pl-3">
                        <p className="text-xs font-pixel uppercase tracking-wider text-cocoa-light">
                            ↩️ Replying to {replyingTo.sender_id === userId ? 'yourself' : 'message'}
                        </p>
                        <p className="text-sm text-cocoa truncate font-bold">
                            {replyingTo.body?.slice(0, 60)}{replyingTo.body && replyingTo.body.length > 60 ? '...' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-2 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/20 border-2 border-transparent hover:border-pixel-red rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* File Preview */}
            {selectedFile && (
                <div className="mb-3 mx-2 px-4 py-3 bg-retro-white border-2 border-cocoa rounded-lg shadow-pixel-sm flex items-center gap-3">
                    {previewUrl && (
                        <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg border-2 border-cocoa" />
                    )}
                    <span className="text-sm text-cocoa font-bold flex-1 truncate">📎 {selectedFile.name}</span>
                    <button
                        onClick={onClearFile}
                        className="p-2 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/20 border-2 border-transparent hover:border-pixel-red rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Recording UI */}
            {isRecording ? (
                <div className="mx-2 mb-2 p-3 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 bg-pixel-red border-2 border-cocoa rounded animate-pulse" />
                        <span className="text-cocoa font-pixel text-sm">{formatTime(recordingTime)}</span>
                        <div className="flex-1 h-2 bg-retro-bg border border-cocoa rounded overflow-hidden">
                            <div className="h-full bg-pixel-red animate-pulse" style={{ width: '60%' }} />
                        </div>
                    </div>
                    <button
                        onClick={cancelRecording}
                        className="p-2 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/20 border-2 border-transparent hover:border-pixel-red rounded-lg transition-colors"
                        title="Cancel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={stopRecording}
                        className="p-2 bg-pixel-red border-2 border-cocoa text-white rounded-lg shadow-pixel-sm transition-all hover:bg-red-500 active:translate-y-0.5 active:shadow-none"
                        title="Send voice message"
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                /* Main Input Container - Pixel Island */
                <form onSubmit={handleSubmit} className="mx-2 mb-2 p-2 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel flex items-center gap-2 focus-within:ring-2 focus-within:ring-pixel-pink transition-all">
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        hidden
                        onChange={handleFileChange}
                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    />

                    {/* Left Icons */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-cocoa-light hover:text-cocoa hover:bg-pixel-blue border-2 border-transparent hover:border-cocoa transition-colors"
                            title="Attach file"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={startRecording}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-cocoa-light hover:text-cocoa hover:bg-pixel-red/20 border-2 border-transparent hover:border-pixel-red transition-colors"
                            title="Voice message"
                            disabled={disabled}
                        >
                            <Mic className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? '✍️ Type your reply...' : '✍️ Type a message...'}
                        className="flex-1 bg-transparent text-cocoa placeholder-cocoa-light text-sm resize-none focus:outline-none min-h-[36px] max-h-[150px] py-2 font-bold"
                        rows={1}
                        disabled={disabled}
                    />

                    {/* Right Icons */}
                    <div className="flex items-center gap-1">
                        {/* AI Magic Wand Button */}
                        <div className="relative suggestions-container">
                            <button
                                type="button"
                                onClick={fetchSuggestions}
                                disabled={loadingSuggestions || !conversationId}
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-pixel-purple hover:text-cocoa hover:bg-pixel-purple/20 border-2 border-transparent hover:border-pixel-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Gợi ý tin nhắn"
                            >
                                {loadingSuggestions ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Wand2 className="w-5 h-5" />
                                )}
                            </button>
                            
                            {/* Suggestions Popover */}
                            {showSuggestions && (
                                <div className="absolute bottom-full right-0 mb-2 bg-retro-paper border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden min-w-[280px] max-w-[350px]">
                                    {/* Header */}
                                    <div className="px-4 py-3 border-b-2 border-cocoa flex items-center justify-between bg-pixel-purple/20">
                                        <div className="flex items-center gap-2">
                                            <Wand2 className="w-4 h-4 text-pixel-purple" />
                                            <span className="text-sm font-pixel uppercase tracking-wider text-cocoa">AI Magic ✨</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowSuggestions(false)}
                                            className="p-1 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/20 border border-transparent hover:border-pixel-red rounded-md transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="p-3">
                                        {loadingSuggestions ? (
                                            <div className="flex items-center justify-center gap-3 py-6">
                                                <Loader2 className="w-5 h-5 text-pixel-purple animate-spin" />
                                                <span className="text-sm text-cocoa-light font-bold">AI đang suy nghĩ...</span>
                                            </div>
                                        ) : suggestionError ? (
                                            <div className="py-4 px-3 text-center">
                                                <p className="text-sm text-pixel-red font-bold">{suggestionError}</p>
                                                <button
                                                    type="button"
                                                    onClick={fetchSuggestions}
                                                    className="mt-2 text-xs text-pixel-purple hover:text-purple-600 font-pixel uppercase tracking-wider"
                                                >
                                                    🔄 Thử lại
                                                </button>
                                            </div>
                                        ) : suggestions.length > 0 ? (
                                            <div className="space-y-2">
                                                {suggestions.map((suggestion, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => handleSuggestionClick(suggestion)}
                                                        className="w-full px-4 py-3 text-left text-sm text-cocoa hover:bg-pixel-blue border-2 border-transparent hover:border-cocoa rounded-lg transition-colors group font-bold"
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <span className="text-pixel-pink">💬</span>
                                                            <span className="line-clamp-2">{suggestion}</span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-4 text-center text-sm text-cocoa-light font-bold">
                                                ✨ Bấm để tạo gợi ý
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="px-4 py-3 border-t-2 border-cocoa bg-retro-bg">
                                        <p className="text-xs text-cocoa-light text-center font-bold">
                                            ✨ Gợi ý dựa trên lịch sử chat & profile đối phương
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Send Button */}
                        <button
                            type="submit"
                            disabled={disabled || (!value.trim() && !selectedFile)}
                            className="w-9 h-9 rounded-lg bg-pixel-pink border-2 border-cocoa text-cocoa flex items-center justify-center hover:bg-pixel-pink-dark shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Send message"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
