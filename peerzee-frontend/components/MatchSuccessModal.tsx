'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageCircle, Heart } from 'lucide-react';
import { type MatchNotification } from '@/hooks/useMatchSocket';

interface MatchSuccessModalProps {
    match: MatchNotification;
    currentUserName?: string;
    onClose: () => void;
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
            <div className="relative bg-[#202020] border border-[#2F2F2F] rounded-xl p-8 max-w-sm w-full mx-4 shadow-2xl">
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
                    <div className="flex items-center justify-center gap-4 mb-6">
                        {/* Current User Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {getInitials(currentUserName)}
                        </div>

                        {/* Heart Icon */}
                        <div className="w-10 h-10 rounded-full bg-[#2F2F2F] flex items-center justify-center">
                            <Heart className="w-5 h-5 text-red-400 fill-current" />
                        </div>

                        {/* Partner Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                            {getInitials(match.partnerProfile.display_name)}
                        </div>
                    </div>

                    <h2 className="text-[#E3E3E3] text-xl font-medium mb-2">
                        It&apos;s a Match!
                    </h2>

                    {/* Description */}
                    <p className="text-[#9B9A97] text-sm mb-8">
                        You and <span className="text-[#E3E3E3]">{match.partnerProfile.display_name}</span> liked each other.
                    </p>

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
                            Say Hello
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
