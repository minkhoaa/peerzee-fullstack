'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ThumbsUp, Award } from 'lucide-react';

interface EngagementTarget {
    type: 'photo' | 'prompt' | 'vibe';
    contentId: string;
    preview: string; // The content being replied to
    emoji?: string;
}

interface EngagementModalProps {
    isOpen: boolean;
    target: EngagementTarget | null;
    recipientName: string;
    onClose: () => void;
    onSend: (message: string) => void;
}

export default function EngagementModal({
    isOpen,
    target,
    recipientName,
    onClose,
    onSend,
}: EngagementModalProps) {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setMessage('');
            setIsSending(false);
            setShowSuccess(false);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!message.trim()) return;

        setIsSending(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setShowSuccess(true);

        // Callback and close after animation
        setTimeout(() => {
            onSend(message);
            onClose();
        }, 800);
    };

    const getHeaderText = () => {
        if (!target) return '';
        switch (target.type) {
            case 'photo':
                return `Reply to ${recipientName}'s photo`;
            case 'prompt':
                return `Reply to ${recipientName}'s answer`;
            case 'vibe':
                return `Connect over "${target.preview}"`;
            default:
                return `Send ${recipientName} a message`;
        }
    };

    const getSuggestedReplies = () => {
        if (!target) return [];
        switch (target.type) {
            case 'prompt':
                return [
                    'Haha, that is so relatable!',
                    'I totally agree with this!',
                    'Tell me more about this...',
                ];
            case 'photo':
                return [
                    'Love this vibe!',
                    'Where was this taken?',
                    'Great photo!',
                ];
            case 'vibe':
                return [
                    `I'm into ${target.preview} too!`,
                    'We should connect!',
                    'Nice taste!',
                ];
            default:
                return [];
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-cocoa/60 z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-retro-white border-t-3 border-cocoa rounded-t-xl overflow-hidden shadow-pixel"
                    >
                        {/* Success Animation */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-retro-white z-10"
                                >
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.1 }}
                                            className="w-20 h-20 rounded-xl bg-pixel-pink border-3 border-cocoa flex items-center justify-center mx-auto mb-4 shadow-pixel"
                                        >
                                            <ThumbsUp className="w-10 h-10 text-cocoa" strokeWidth={2.5} />
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-lg font-pixel uppercase tracking-widest text-cocoa"
                                        >
                                            Sent to {recipientName}!
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Handle Bar */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 rounded-full bg-cocoa/30" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-cocoa/20">
                            <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-pixel-yellow" strokeWidth={2.5} />
                                <h3 className="text-sm font-pixel uppercase tracking-widest text-cocoa">
                                    {getHeaderText()}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg border-2 border-cocoa hover:bg-pixel-red transition-colors"
                            >
                                <X className="w-5 h-5 text-cocoa" />
                            </button>
                        </div>

                        {/* Content Preview */}
                        {target && (
                            <div className="px-5 py-4">
                                <div className="bg-retro-paper border-2 border-cocoa rounded-xl p-4 shadow-pixel-sm">
                                    <div className="flex items-start gap-3">
                                        {target.emoji && (
                                            <span className="text-xl">{target.emoji}</span>
                                        )}
                                        <p className="text-sm text-cocoa font-bold line-clamp-2">
                                            {target.preview}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Replies */}
                        <div className="px-5 pb-3">
                            <div className="flex flex-wrap gap-2">
                                {getSuggestedReplies().map((reply, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setMessage(reply)}
                                        className="px-3 py-1.5 text-xs text-cocoa bg-pixel-yellow font-bold rounded-lg border-2 border-cocoa hover:bg-pixel-pink hover:translate-y-0.5 transition-all shadow-pixel-sm"
                                    >
                                        {reply}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="px-5 pb-8">
                            <div className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write something genuine..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-retro-white border-3 border-cocoa rounded-xl text-cocoa text-sm font-bold placeholder:text-cocoa-light resize-none focus:outline-none shadow-pixel-inset transition-colors"
                                />

                                {/* Send Button */}
                                <div className="mt-3 flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSend}
                                        disabled={!message.trim() || isSending}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-pixel-pink text-cocoa text-sm font-pixel uppercase tracking-widest border-3 border-cocoa rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSending ? 'Sending...' : 'Send Like'}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export type { EngagementTarget };
