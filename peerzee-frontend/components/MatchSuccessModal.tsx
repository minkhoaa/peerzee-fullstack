'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Heart, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { type MatchNotification } from '@/hooks/useMatchSocket';
import api from '@/lib/api';

interface MatchSuccessModalProps {
    match: MatchNotification;
    currentUserName?: string;
    onClose: () => void;
}

interface IceBreaker {
    id: string;
    prompt: string;
    category: string;
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function MatchSuccessModal({
    match,
    currentUserName = 'You',
    onClose,
}: MatchSuccessModalProps) {
    const router = useRouter();
    const [iceBreakers, setIceBreakers] = useState<IceBreaker[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch ice breakers on mount
    useEffect(() => {
        const fetchIceBreakers = async () => {
            try {
                const res = await api.get('/chat/ice-breakers?count=3');
                setIceBreakers(res.data);
            } catch (error) {
                console.error('Failed to fetch ice breakers:', error);
                // Use fallback
                setIceBreakers([
                    { id: '1', prompt: "What's your favorite way to spend a weekend?", category: 'general' },
                    { id: '2', prompt: "If you could travel anywhere right now, where would you go?", category: 'fun' },
                    { id: '3', prompt: "What's something you're really passionate about?", category: 'deep' },
                ]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIceBreakers();
    }, []);

    const handleRefreshIceBreakers = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/chat/ice-breakers?count=3');
            setIceBreakers(res.data);
        } catch (error) {
            console.error('Failed to refresh ice breakers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseIceBreaker = (prompt: string) => {
        // Navigate to chat with pre-filled message
        const encodedMessage = encodeURIComponent(prompt);
        router.push(`/chat?conversation=${match.conversationId}&draft=${encodedMessage}`);
        onClose();
    };

    const handleSayHello = () => {
        router.push(`/chat?conversation=${match.conversationId}`);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#3E3229]/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal - ToyWorld styled */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                    className="relative bg-white border-2 border-[#ECC8CD]/40 rounded-[40px] p-6 max-w-md w-full mx-4 shadow-2xl shadow-[#CD6E67]/20"
                >
                    {/* Confetti decoration */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl">🎉</div>

                    {/* Close button */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-[#7A6862] hover:text-[#CD6E67] hover:bg-[#FDF0F1] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </motion.button>

                    {/* Content */}
                    <div className="text-center pt-4">
                        {/* Avatars */}
                        <div className="flex items-center justify-center gap-4 mb-4">
                            {/* Current User Avatar */}
                            <motion.div 
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CD6E67] to-[#E88B85] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#CD6E67]/30 border-4 border-white"
                            >
                                {getInitials(currentUserName)}
                            </motion.div>

                            {/* Heart Icon */}
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: 'spring' }}
                                className="w-10 h-10 rounded-full bg-[#FDF0F1] flex items-center justify-center border-2 border-[#ECC8CD]/40"
                            >
                                <Heart className="w-5 h-5 text-[#CD6E67] fill-current" />
                            </motion.div>

                            {/* Partner Avatar */}
                            <motion.div 
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-400/30 border-4 border-white"
                            >
                                {getInitials(match.partnerProfile.display_name)}
                            </motion.div>
                        </div>

                        <motion.h2 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-[#3E3229] text-2xl font-nunito font-bold mb-1"
                        >
                            It&apos;s a Match! 💕
                        </motion.h2>

                        {/* Description */}
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-[#7A6862] text-sm mb-5"
                        >
                            You and <span className="text-[#CD6E67] font-bold">{match.partnerProfile.display_name}</span> liked each other.
                        </motion.p>

                        {/* Ice Breakers Section - ToyWorld styled */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="text-left mb-5"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-[#7A6862]">
                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Conversation starters</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleRefreshIceBreakers}
                                    disabled={isLoading}
                                    className="p-2 text-[#7A6862] hover:text-[#CD6E67] hover:bg-[#FDF0F1] rounded-full transition-colors disabled:opacity-50"
                                    title="Get new suggestions"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </motion.button>
                            </div>

                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="py-4 text-center text-[#7A6862] text-sm">Loading... ✨</div>
                                ) : (
                                    iceBreakers.map((ib, index) => (
                                        <motion.button
                                            key={ib.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.8 + index * 0.1 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleUseIceBreaker(ib.prompt)}
                                            className="w-full group flex items-center justify-between gap-3 p-3 bg-[#FDF0F1] hover:bg-[#ECC8CD]/30 border-2 border-[#ECC8CD]/40 hover:border-[#CD6E67]/50 rounded-[20px] transition-all text-left"
                                        >
                                            <p className="text-[#3E3229] text-sm leading-snug flex-1 font-medium">
                                                &quot;{ib.prompt}&quot;
                                            </p>
                                            <ArrowRight className="w-4 h-4 text-[#7A6862] group-hover:text-[#CD6E67] shrink-0 transition-colors" />
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>

                        {/* Actions - ToyWorld styled */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            className="flex gap-3"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="flex-1 px-4 py-3 text-[#7A6862] hover:text-[#CD6E67] bg-[#FDF0F1] hover:bg-[#ECC8CD]/30 rounded-full transition-colors text-sm font-bold border-2 border-[#ECC8CD]/40"
                            >
                                Keep Swiping
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSayHello}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#CD6E67] to-[#E88B85] hover:from-[#B85C55] hover:to-[#CD6E67] text-white rounded-full transition-colors text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#CD6E67]/30 border-b-4 border-[#B85C55]/50"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Write my own
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
