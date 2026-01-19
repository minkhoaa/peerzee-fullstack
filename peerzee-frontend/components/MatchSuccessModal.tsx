'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[#202020] border border-[#2F2F2F] rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center">
                    {/* Avatars */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Current User Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(currentUserName)}
                        </div>

                        {/* Heart Icon */}
                        <div className="w-9 h-9 rounded-full bg-[#2F2F2F] flex items-center justify-center">
                            <Heart className="w-4 h-4 text-red-400 fill-current" />
                        </div>

                        {/* Partner Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                            {getInitials(match.partnerProfile.display_name)}
                        </div>
                    </div>

                    <h2 className="text-[#E3E3E3] text-xl font-medium mb-1">
                        It&apos;s a Match!
                    </h2>

                    {/* Description */}
                    <p className="text-[#9B9A97] text-sm mb-5">
                        You and <span className="text-[#E3E3E3]">{match.partnerProfile.display_name}</span> liked each other.
                    </p>

                    {/* Ice Breakers Section */}
                    <div className="text-left mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-medium uppercase tracking-wider">Conversation starters</span>
                            </div>
                            <button
                                onClick={handleRefreshIceBreakers}
                                disabled={isLoading}
                                className="p-1 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors disabled:opacity-50"
                                title="Get new suggestions"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="py-4 text-center text-[#9B9A97] text-sm">Loading...</div>
                            ) : (
                                iceBreakers.map((ib) => (
                                    <button
                                        key={ib.id}
                                        onClick={() => handleUseIceBreaker(ib.prompt)}
                                        className="w-full group flex items-center justify-between gap-3 p-3 bg-[#2A2A2A] hover:bg-[#333] border border-[#3A3A3A] hover:border-[#4A4A4A] rounded-lg transition-all text-left"
                                    >
                                        <p className="text-[#E3E3E3] text-sm leading-snug flex-1">
                                            &quot;{ib.prompt}&quot;
                                        </p>
                                        <ArrowRight className="w-4 h-4 text-[#9B9A97] group-hover:text-[#E3E3E3] shrink-0 transition-colors" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-lg transition-colors text-sm font-medium"
                        >
                            Keep Swiping
                        </button>
                        <button
                            onClick={handleSayHello}
                            className="flex-1 px-4 py-2.5 bg-[#E3E3E3] hover:bg-white text-[#191919] rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Write my own
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
