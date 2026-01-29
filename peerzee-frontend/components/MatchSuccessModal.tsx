'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageSquareText, Star, Award, ArrowRight, RefreshCw } from 'lucide-react';
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

/**
 * MatchSuccessModal - Retro Pixel OS styled match success screen
 * Shows ice breakers and options to start chatting
 */
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
                className="absolute inset-0 bg-cocoa/60"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-retro-white border-3 border-cocoa rounded-xl p-6 max-w-md w-full mx-4 shadow-pixel-lg">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-cocoa hover:bg-pixel-red border-2 border-cocoa rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="text-center">
                    {/* Avatars */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* Current User Avatar */}
                        <div className="w-14 h-14 rounded-xl bg-pixel-blue border-3 border-cocoa shadow-pixel-sm flex items-center justify-center text-cocoa font-pixel text-lg">
                            {getInitials(currentUserName)}
                        </div>

                        {/* Heart Icon */}
                        <div className="w-9 h-9 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center">
                            <Star className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
                        </div>

                        {/* Partner Avatar */}
                        <div className="w-14 h-14 rounded-xl bg-pixel-purple border-3 border-cocoa shadow-pixel-sm flex items-center justify-center text-cocoa font-pixel text-lg">
                            {getInitials(match.partnerProfile.display_name)}
                        </div>
                    </div>

                    <h2 className="text-cocoa text-xl font-pixel uppercase tracking-widest mb-1">
                        It&apos;s a Match!
                    </h2>

                    {/* Description */}
                    <p className="text-cocoa-light text-sm font-bold mb-5">
                        You and <span className="text-cocoa">{match.partnerProfile.display_name}</span> liked each other.
                    </p>

                    {/* Ice Breakers Section */}
                    <div className="text-left mb-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-cocoa-light">
                                <Award className="w-4 h-4 text-pixel-yellow" strokeWidth={2.5} />
                                <span className="text-xs font-pixel uppercase tracking-widest">Conversation starters</span>
                            </div>
                            <button
                                onClick={handleRefreshIceBreakers}
                                disabled={isLoading}
                                className="p-1.5 text-cocoa hover:bg-pixel-blue border border-cocoa rounded-lg transition-colors disabled:opacity-50"
                                title="Get new suggestions"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {isLoading ? (
                                <div className="py-4 text-center text-cocoa-light text-sm font-bold">Loading...</div>
                            ) : (
                                iceBreakers.map((ib) => (
                                    <button
                                        key={ib.id}
                                        onClick={() => handleUseIceBreaker(ib.prompt)}
                                        className="w-full group flex items-center justify-between gap-3 p-3 bg-retro-paper hover:bg-pixel-yellow border-2 border-cocoa rounded-lg shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all text-left"
                                    >
                                        <p className="text-cocoa text-sm leading-snug flex-1 font-bold">
                                            &quot;{ib.prompt}&quot;
                                        </p>
                                        <ArrowRight className="w-4 h-4 text-cocoa-light group-hover:text-cocoa shrink-0 transition-colors" />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-cocoa hover:bg-retro-paper border-2 border-cocoa rounded-lg transition-colors text-sm font-bold"
                        >
                            Keep Swiping
                        </button>
                        <button
                            onClick={handleSayHello}
                            className="flex-1 px-4 py-2.5 bg-pixel-pink text-cocoa border-2 border-cocoa rounded-lg shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all text-sm font-pixel uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <MessageSquareText className="w-4 h-4" strokeWidth={2.5} />
                            Say Hi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
