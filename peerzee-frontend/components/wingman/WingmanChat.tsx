'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MessageCircle, 
    Send, 
    X, 
    Sparkles, 
    Lightbulb, 
    MessageSquare,
    Trash2,
    Loader2,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WingmanMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface WingmanChatProps {
    targetUserId?: string; // If chatting about a specific person
    chatContext?: string;  // Recent chat history for context
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * WingmanChat - AI Dating Coach Chatbot
 * Floating chat widget that helps users with dating advice
 */
export default function WingmanChat({ targetUserId, chatContext }: WingmanChatProps) {
    const { token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<WingmanMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load history when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/wingman/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.messages?.length > 0) {
                    setMessages(data.messages);
                }
            }
        } catch (error) {
            console.error('Failed to load wingman history:', error);
        }
    };

    const sendMessage = async (message: string) => {
        if (!message.trim() || !token) return;

        const userMessage: WingmanMessage = {
            role: 'user',
            content: message,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setSuggestions([]);

        try {
            const res = await fetch(`${API_BASE}/wingman/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    targetUserId,
                    chatContext
                })
            });

            if (res.ok) {
                const data = await res.json();
                const assistantMessage: WingmanMessage = {
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            console.error('Wingman chat failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Xin lỗi, có lỗi xảy ra. Thử lại nhé! 😅',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = async () => {
        if (!token) return;
        try {
            await fetch(`${API_BASE}/wingman/history`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages([]);
            setSuggestions([]);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const getProfileTips = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/profile-tips`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const tipsMessage = data.tips
                    .map((t: any) => `• [${t.priority.toUpperCase()}] ${t.tip}`)
                    .join('\n');
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `📊 Điểm Profile: ${data.overallScore}/100\n\n${tipsMessage}`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to get profile tips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcebreakers = async () => {
        if (!token || !targetUserId) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/wingman/icebreakers/${targetUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const icebreakersList = data.icebreakers
                    .map((ib: string, i: number) => `${i + 1}. "${ib}"`)
                    .join('\n\n');
                
                const hintsText = data.contextHints?.length > 0
                    ? `\n\n💡 Tips:\n${data.contextHints.map((h: string) => `• ${h}`).join('\n')}`
                    : '';
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `🧊 Gợi ý mở đầu:\n\n${icebreakersList}${hintsText}`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to get icebreakers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Quick actions for first-time users
    const quickActions = [
        { icon: Lightbulb, label: 'Profile Tips', action: getProfileTips },
        ...(targetUserId ? [{ icon: MessageSquare, label: 'Icebreakers', action: getIcebreakers }] : []),
    ];

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-pixel-purple to-pixel-pink text-white rounded-full shadow-lg border-2 border-cocoa hover:scale-110 transition-transform ${isOpen ? 'hidden' : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Sparkles className="w-6 h-6" />
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-retro-paper border-3 border-cocoa rounded-2xl shadow-pixel-lg flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-pixel-purple/20 to-pixel-pink/20 border-b-2 border-cocoa">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-pixel-purple" />
                                <h3 className="font-pixel text-sm text-cocoa">Wingman AI</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={clearHistory}
                                    className="p-1.5 text-cocoa-light hover:text-pixel-red transition-colors"
                                    title="Clear chat"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-cocoa-light hover:text-cocoa transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <Sparkles className="w-12 h-12 text-pixel-purple/30 mx-auto mb-3" />
                                    <p className="text-sm text-cocoa-light mb-4">
                                        Chào! Mình là Wingman AI 👋<br />
                                        Hỏi mình bất cứ điều gì về dating nhé!
                                    </p>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickActions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={action.action}
                                                disabled={isLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-pixel-purple/10 text-pixel-purple rounded-full border border-pixel-purple/30 hover:bg-pixel-purple/20 transition-colors disabled:opacity-50"
                                            >
                                                <action.icon className="w-3 h-3" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                                            msg.role === 'user'
                                                ? 'bg-pixel-purple text-white rounded-br-sm'
                                                : 'bg-cocoa/10 text-cocoa rounded-bl-sm'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="px-3 py-2 bg-cocoa/10 rounded-xl rounded-bl-sm">
                                        <Loader2 className="w-4 h-4 animate-spin text-cocoa-light" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="px-4 py-2 border-t border-cocoa/10">
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s)}
                                            className="text-xs px-2.5 py-1 bg-pixel-pink/10 text-cocoa rounded-full border border-pixel-pink/30 hover:bg-pixel-pink/20 transition-colors truncate max-w-full"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t-2 border-cocoa/20">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Hỏi Wingman..."
                                    className="flex-1 px-3 py-2 text-sm bg-white border-2 border-cocoa/30 rounded-xl focus:border-pixel-purple outline-none"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2 bg-pixel-purple text-white rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-purple/80 disabled:opacity-50 transition-colors active:translate-y-0.5 active:shadow-none"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
