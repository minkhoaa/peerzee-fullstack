'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Lock, Unlock, MessageCircle } from 'lucide-react';

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
 * ToyWorld/Cozy Clay themed
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

    // If unlocked, show success state - ToyWorld styled
    if (isUnlocked) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-[#ECC8CD]/40 rounded-[30px] p-5 mb-4 shadow-lg shadow-[#CD6E67]/10"
            >
                <div className="flex items-center gap-2 text-green-500 mb-4">
                    <div className="p-2 bg-green-100 rounded-full">
                        <Unlock className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold">Chat Unlocked! 🎉</span>
                </div>
                <div className="text-sm text-[#7A6862] mb-3 text-center italic">&ldquo;{question}&rdquo;</div>
                <div className="flex gap-3">
                    <div className="flex-1 p-4 bg-[#FDF0F1] rounded-[20px] border-2 border-[#ECC8CD]/30">
                        <div className="text-xs text-[#CD6E67] font-bold mb-2">You answered:</div>
                        <div className="text-sm text-[#3E3229] font-medium">{myAnswer}</div>
                    </div>
                    <div className="flex-1 p-4 bg-[#FDF0F1] rounded-[20px] border-2 border-[#ECC8CD]/30">
                        <div className="text-xs text-[#CD6E67] font-bold mb-2">{partnerName} answered:</div>
                        <div className="text-sm text-[#3E3229] font-medium">{partnerAnswer}</div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-[#ECC8CD]/40 rounded-[30px] p-5 mb-4 shadow-lg shadow-[#CD6E67]/10"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-[#CD6E67]/20 to-[#E88B85]/20 rounded-full">
                    <Sparkles className="w-5 h-5 text-[#CD6E67]" />
                </div>
                <div>
                    <h3 className="text-sm font-nunito font-bold text-[#3E3229]">Icebreaker 💬</h3>
                    <p className="text-xs text-[#7A6862]">Answer to unlock the chat</p>
                </div>
                <div className="ml-auto p-2 bg-[#FDF0F1] rounded-full">
                    <Lock className="w-4 h-4 text-[#CD6E67]" />
                </div>
            </div>

            {/* Question - Candy styled card */}
            <div className="text-center py-5 px-6 mb-4 bg-gradient-to-br from-[#FDF0F1] to-white rounded-[20px] border-2 border-[#ECC8CD]/40 shadow-inner">
                <MessageCircle className="w-6 h-6 text-[#CD6E67] mx-auto mb-2" />
                <p className="text-lg text-[#3E3229] font-nunito font-bold">{question}</p>
            </div>

            {/* Answer Section */}
            {hasAnswered ? (
                <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-[20px] border-2 border-green-200">
                        <div className="text-xs text-green-600 font-bold mb-2">✅ Your answer:</div>
                        <div className="text-sm text-[#3E3229] font-medium">{myAnswer}</div>
                    </div>
                    <div className="flex items-center justify-center gap-3 py-4 text-[#7A6862]">
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-3 h-3 bg-[#CD6E67] rounded-full" 
                        />
                        <span className="text-sm font-medium">Waiting for {partnerName} to answer...</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-5 py-4 bg-[#FDF0F1] border-2 border-[#ECC8CD]/40 rounded-full text-[#3E3229] placeholder-[#7A6862] focus:outline-none focus:border-[#CD6E67]/50 focus:bg-white transition-all"
                        disabled={isSubmitting}
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!answer.trim() || isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#CD6E67] to-[#E88B85] text-white rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#B85C55] hover:to-[#CD6E67] transition-all shadow-lg shadow-[#CD6E67]/30 border-b-4 border-[#B85C55]/50"
                    >
                        <Send className="w-4 h-4" />
                        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                    </motion.button>
                </form>
            )}
        </motion.div>
    );
}
