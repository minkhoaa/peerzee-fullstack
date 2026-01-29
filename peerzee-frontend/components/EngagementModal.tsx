'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Sparkles } from 'lucide-react';

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
                    'Haha, that is so relatable! 😄',
                    'I totally agree with this!',
                    'Tell me more about this...',
                ];
            case 'photo':
                return [
                    'Love this vibe! ✨',
                    'Where was this taken?',
                    'Great photo!',
                ];
            case 'vibe':
                return [
                    `I'm into ${target.preview} too!`,
                    'We should connect!',
                    'Nice taste! 🎯',
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
                        className="fixed inset-0 bg-[#3E3229]/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet - ToyWorld styled */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-[#ECC8CD]/40 rounded-t-[40px] overflow-hidden shadow-2xl shadow-[#CD6E67]/20"
                    >
                        {/* Success Animation - ToyWorld styled */}
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-white z-10"
                                >
                                    <div className="text-center">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', delay: 0.1 }}
                                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CD6E67] to-[#E88B85] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#CD6E67]/30"
                                        >
                                            <Heart className="w-10 h-10 text-white fill-white" />
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-lg font-nunito font-bold text-[#3E3229]"
                                        >
                                            Sent to {recipientName}! 💕
                                        </motion.p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Handle Bar */}
                        <div className="flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 rounded-full bg-[#ECC8CD]" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#ECC8CD]/30">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#CD6E67]" />
                                <h3 className="text-sm font-nunito font-bold text-[#3E3229]">
                                    {getHeaderText()}
                                </h3>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-[#FDF0F1] transition-colors"
                            >
                                <X className="w-5 h-5 text-[#7A6862]" />
                            </motion.button>
                        </div>

                        {/* Content Preview - ToyWorld styled */}
                        {target && (
                            <div className="px-5 py-4">
                                <div className="bg-[#FDF0F1] border-2 border-[#ECC8CD]/40 rounded-[20px] p-4">
                                    <div className="flex items-start gap-3">
                                        {target.emoji && (
                                            <span className="text-xl">{target.emoji}</span>
                                        )}
                                        <p className="text-sm text-[#7A6862] line-clamp-2 font-medium">
                                            {target.preview}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Replies - ToyWorld styled */}
                        <div className="px-5 pb-3">
                            <div className="flex flex-wrap gap-2">
                                {getSuggestedReplies().map((reply, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setMessage(reply)}
                                        className="px-4 py-2 text-xs text-[#7A6862] bg-white rounded-full border-2 border-[#ECC8CD]/40 hover:bg-[#FDF0F1] hover:text-[#CD6E67] hover:border-[#CD6E67]/50 transition-colors font-semibold"
                                    >
                                        {reply}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Input Area - ToyWorld styled */}
                        <div className="px-5 pb-8">
                            <div className="relative">
                                <textarea
                                    ref={inputRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write something genuine..."
                                    rows={3}
                                    className="w-full px-5 py-4 bg-[#FDF0F1] border-2 border-[#ECC8CD]/40 rounded-[25px] text-[#3E3229] text-sm placeholder:text-[#7A6862] resize-none focus:outline-none focus:border-[#CD6E67]/50 focus:bg-white transition-all"
                                />

                                {/* Send Button */}
                                <div className="mt-3 flex justify-end">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleSend}
                                        disabled={!message.trim() || isSending}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#CD6E67] to-[#E88B85] text-white text-sm font-bold rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#CD6E67]/30 border-b-4 border-[#B85C55]/50"
                                    >
                                        <Send className="w-4 h-4" />
                                        {isSending ? 'Sending...' : 'Send Like 💕'}
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
