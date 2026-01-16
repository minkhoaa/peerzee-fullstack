'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Lock, Unlock } from 'lucide-react';

interface IcebreakerModalProps {
    question: string;
    myAnswer?: string;
    partnerAnswer?: string;
    hasAnswered: boolean;
    isUnlocked: boolean;
    partnerName: string;
    onSubmitAnswer: (answer: string) => Promise<void>;
}

/**
 * IcebreakerModal - Overlay that blocks chat until both users answer
 * Shows question, allows answer submission, reveals partner's answer after unlock
 */
export default function IcebreakerModal({
    question,
    myAnswer,
    partnerAnswer,
    hasAnswered,
    isUnlocked,
    partnerName,
    onSubmitAnswer,
}: IcebreakerModalProps) {
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmitAnswer(answer.trim());
        } finally {
            setIsSubmitting(false);
        }
    };

    // If unlocked, show success state briefly
    if (isUnlocked) {
        return (
            <div className="bg-[#202020] border border-[#2F2F2F] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-green-400 mb-3">
                    <Unlock className="w-4 h-4" />
                    <span className="text-sm font-medium">Chat Unlocked!</span>
                </div>
                <div className="text-sm text-[#9B9A97] mb-2">{question}</div>
                <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-[#191919] rounded-lg border border-[#2F2F2F]">
                        <div className="text-xs text-[#9B9A97] mb-1">You answered:</div>
                        <div className="text-sm text-[#E3E3E3]">{myAnswer}</div>
                    </div>
                    <div className="flex-1 p-3 bg-[#191919] rounded-lg border border-[#2F2F2F]">
                        <div className="text-xs text-[#9B9A97] mb-1">{partnerName} answered:</div>
                        <div className="text-sm text-[#E3E3E3]">{partnerAnswer}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#202020] border border-[#2F2F2F] rounded-xl p-4 mb-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-[#E3E3E3]">Icebreaker</h3>
                    <p className="text-xs text-[#9B9A97]">Answer to unlock the chat</p>
                </div>
                <Lock className="w-4 h-4 text-[#9B9A97] ml-auto" />
            </div>

            {/* Question */}
            <div className="text-center py-4 px-6 mb-4 bg-[#191919] rounded-xl border border-[#2F2F2F]">
                <p className="text-lg text-[#E3E3E3] font-medium">{question}</p>
            </div>

            {/* Answer Section */}
            {hasAnswered ? (
                <div className="space-y-3">
                    <div className="p-3 bg-[#191919] rounded-lg border border-green-500/30">
                        <div className="text-xs text-green-400 mb-1">Your answer:</div>
                        <div className="text-sm text-[#E3E3E3]">{myAnswer}</div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-3 text-[#9B9A97]">
                        <div className="w-2 h-2 bg-[#9B9A97] rounded-full animate-pulse" />
                        <span className="text-sm">Waiting for {partnerName} to answer...</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-3 bg-[#191919] border border-[#2F2F2F] rounded-xl text-[#E3E3E3] placeholder-[#9B9A97] focus:outline-none focus:border-purple-500/50 transition-colors"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!answer.trim() || isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                </form>
            )}
        </div>
    );
}
