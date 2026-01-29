'use client';

import React, { useState } from 'react';
import { Award, Send, Lock, Unlock } from 'lucide-react';

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
            <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-4 mb-4">
                <div className="flex items-center gap-2 text-pixel-green mb-3">
                    <Unlock className="w-4 h-4" />
                    <span className="text-sm font-pixel uppercase tracking-widest">Chat Unlocked!</span>
                </div>
                <div className="text-sm text-cocoa-light mb-2 font-medium">{question}</div>
                <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-retro-paper rounded-lg border-2 border-cocoa">
                        <div className="text-xs text-cocoa font-pixel uppercase tracking-wider mb-1">You answered:</div>
                        <div className="text-sm text-cocoa font-medium">{myAnswer}</div>
                    </div>
                    <div className="flex-1 p-3 bg-retro-paper rounded-lg border-2 border-cocoa">
                        <div className="text-xs text-cocoa font-pixel uppercase tracking-wider mb-1">{partnerName} answered:</div>
                        <div className="text-sm text-cocoa font-medium">{partnerAnswer}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-4 mb-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pixel-purple/30 rounded-lg border-2 border-cocoa">
                    <Award className="w-5 h-5 text-pixel-purple" strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-sm font-pixel text-cocoa uppercase tracking-widest">Icebreaker</h3>
                    <p className="text-xs text-cocoa-light font-medium">Answer to unlock the chat</p>
                </div>
                <Lock className="w-4 h-4 text-cocoa-light ml-auto" />
            </div>

            {/* Question */}
            <div className="text-center py-4 px-6 mb-4 bg-retro-paper rounded-xl border-2 border-cocoa">
                <p className="text-lg text-cocoa font-bold">{question}</p>
            </div>

            {/* Answer Section */}
            {hasAnswered ? (
                <div className="space-y-3">
                    <div className="p-3 bg-pixel-green/20 rounded-lg border-2 border-pixel-green">
                        <div className="text-xs text-pixel-green font-pixel uppercase tracking-wider mb-1">Your answer:</div>
                        <div className="text-sm text-cocoa font-medium">{myAnswer}</div>
                    </div>
                    <div className="flex items-center justify-center gap-2 py-3 text-cocoa-light">
                        <div className="w-2 h-2 bg-pixel-pink rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Waiting for {partnerName} to answer...</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-3 bg-retro-paper border-2 border-cocoa rounded-xl text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-pink font-bold shadow-pixel-inset transition-colors"
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={!answer.trim() || isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pixel-pink text-cocoa rounded-xl font-pixel uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pixel-pink-dark border-2 border-cocoa shadow-pixel-sm active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </button>
                </form>
            )}
        </div>
    );
}
