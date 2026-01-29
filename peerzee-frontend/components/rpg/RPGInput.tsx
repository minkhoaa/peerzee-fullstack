'use client';

import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface RPGInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onAttachment?: () => void;
    onVoice?: () => void;
    onAI?: () => void;
    placeholder?: string;
    disabled?: boolean;
    replyingTo?: { senderName: string; body: string } | null;
    onCancelReply?: () => void;
    isRecording?: boolean;
    recordingTime?: number;
    attachmentPreview?: string | null;
    onClearAttachment?: () => void;
}

/**
 * RPGInput - Pixel RPG styled chat input
 * Features: pixel border, action icons, retro aesthetic
 */
export default function RPGInput({
    value,
    onChange,
    onSend,
    onAttachment,
    onVoice,
    onAI,
    placeholder = 'Type your message...',
    disabled,
    replyingTo,
    onCancelReply,
    isRecording,
    recordingTime = 0,
    attachmentPreview,
    onClearAttachment,
}: RPGInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white border-t-4 border-rpg-brown p-4">
            {/* Reply preview */}
            {replyingTo && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-rpg-blue/50 border-2 border-rpg-brown">
                    <div className="flex-1 border-l-2 border-primary pl-3">
                        <p className="text-xs font-display font-semibold text-rpg-brown">
                            Replying to {replyingTo.senderName}
                        </p>
                        <p className="text-xs text-rpg-brown/70 truncate">
                            {replyingTo.body}
                        </p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 text-rpg-brown hover:bg-rpg-brown/10 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Attachment preview */}
            {attachmentPreview && (
                <div className="relative mb-3 inline-block">
                    <img
                        src={attachmentPreview}
                        alt="Attachment"
                        className="max-h-32 border-2 border-rpg-brown"
                    />
                    <button
                        onClick={onClearAttachment}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white border-2 border-rpg-brown flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
                <div className="flex items-center gap-3 mb-3 px-3 py-2 bg-red-50 border-2 border-red-400">
                    <div className="w-3 h-3 bg-red-500 animate-pulse" />
                    <span className="font-display text-sm text-red-600 font-medium">
                        Recording... {formatTime(recordingTime)}
                    </span>
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-3">
                {/* Left actions */}
                <div className="flex gap-1">
                    {onAttachment && (
                        <button
                            onClick={onAttachment}
                            disabled={disabled}
                            className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all disabled:opacity-50"
                            title="Attach file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>
                    )}
                    
                    {onAI && (
                        <button
                            onClick={onAI}
                            disabled={disabled}
                            className="p-2 text-primary hover:bg-primary-light border-2 border-transparent hover:border-primary transition-all disabled:opacity-50"
                            title="AI Suggestions"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Text input */}
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
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
                    {onVoice && !value.trim() && (
                        <button
                            onClick={onVoice}
                            disabled={disabled}
                            className={clsx(
                                'p-2 border-2 transition-all disabled:opacity-50',
                                isRecording
                                    ? 'bg-red-500 text-white border-rpg-brown'
                                    : 'text-rpg-brown hover:bg-rpg-blue border-transparent hover:border-rpg-brown'
                            )}
                            title={isRecording ? 'Stop recording' : 'Voice message'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    )}
                    
                    {/* Send button */}
                    <button
                        onClick={onSend}
                        disabled={disabled || (!value.trim() && !attachmentPreview)}
                        className={clsx(
                            'p-2 border-2 border-rpg-brown transition-all',
                            'bg-primary text-white',
                            'shadow-[2px_2px_0_0_#4a3b32]',
                            'active:translate-y-[2px] active:shadow-none',
                            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0'
                        )}
                        title="Send message"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
