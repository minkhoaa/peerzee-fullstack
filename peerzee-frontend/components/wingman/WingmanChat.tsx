'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { 
    Send, 
    X, 
    Lightbulb, 
    MessageSquare,
    Trash2,
    Heart,
    MapPin,
    Sparkles,
    Wand2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface WingmanMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    toolsUsed?: string[]; // Tools executed by agentic AI
}

interface WingmanChatProps {
    targetUserId?: string;
    chatContext?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';

// Cute Chibi Cupid SVG Component
const ChibiCupid = ({ className = "", isHappy = false }: { className?: string; isHappy?: boolean }) => (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wings */}
        <ellipse cx="16" cy="28" rx="10" ry="14" fill="#F5E6C8" stroke="#62544B" strokeWidth="2"/>
        <ellipse cx="48" cy="28" rx="10" ry="14" fill="#F5E6C8" stroke="#62544B" strokeWidth="2"/>
        <ellipse cx="14" cy="26" rx="5" ry="8" fill="#FFFFFF" opacity="0.6"/>
        <ellipse cx="50" cy="26" rx="5" ry="8" fill="#FFFFFF" opacity="0.6"/>
        
        {/* Body */}
        <ellipse cx="32" cy="42" rx="12" ry="10" fill="#FFEEDD" stroke="#62544B" strokeWidth="2"/>
        
        {/* Head */}
        <circle cx="32" cy="26" r="14" fill="#FFEEDD" stroke="#62544B" strokeWidth="2"/>
        
        {/* Hair - Cute curly */}
        <path d="M20 20 Q18 12 24 14 Q22 8 30 10 Q28 6 36 8 Q34 4 42 10 Q48 8 46 16 Q50 14 48 22" 
              fill="#F5C17A" stroke="#62544B" strokeWidth="1.5"/>
        
        {/* Blush */}
        <ellipse cx="24" cy="28" rx="3" ry="2" fill="#F4AAB9" opacity="0.6"/>
        <ellipse cx="40" cy="28" rx="3" ry="2" fill="#F4AAB9" opacity="0.6"/>
        
        {/* Eyes */}
        {isHappy ? (
            <>
                <path d="M26 24 Q28 22 30 24" stroke="#62544B" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M34 24 Q36 22 38 24" stroke="#62544B" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </>
        ) : (
            <>
                <circle cx="28" cy="24" r="2" fill="#62544B"/>
                <circle cx="36" cy="24" r="2" fill="#62544B"/>
                <circle cx="29" cy="23" r="0.8" fill="#FFFFFF"/>
                <circle cx="37" cy="23" r="0.8" fill="#FFFFFF"/>
            </>
        )}
        
        {/* Mouth */}
        <path d={isHappy ? "M29 30 Q32 34 35 30" : "M30 31 Q32 33 34 31"} 
              stroke="#62544B" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        
        {/* Heart on chest */}
        <path d="M29 42 C29 40 31 38 32 40 C33 38 35 40 35 42 L32 46 Z" fill="#F08080"/>
        
        {/* Bow & Arrow */}
        <path d="M50 44 Q58 38 54 50" stroke="#8B6914" strokeWidth="2" fill="none"/>
        <line x1="46" y1="40" x2="58" y2="48" stroke="#8B6914" strokeWidth="1.5"/>
        <polygon points="58,48 60,44 56,46" fill="#F08080"/>
    </svg>
);

// Typing indicator with pixel style
const TypingDots = () => (
    <div className="flex gap-1 items-center px-3 py-2">
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="w-2 h-2 bg-cocoa rounded-sm"
                animate={{ y: [0, -4, 0] }}
                transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.15,
                    ease: "easeInOut"
                }}
            />
        ))}
    </div>
);

/**
 * WingmanChat - Pixel-style Dating Coach Chatbot
 * Cute chibi cupid that helps with dating advice
 */
export default function WingmanChat({ targetUserId, chatContext }: WingmanChatProps) {
    const { token } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<WingmanMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isHappy, setIsHappy] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Only allow dragging on chat pages
    const isDraggable = pathname?.startsWith('/chat');
    
    // Draggable position state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const constraintsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            loadHistory();
        }
    }, [isOpen]);

    // Make cupid happy when sending/receiving messages
    useEffect(() => {
        if (isLoading) {
            setIsHappy(true);
            const timer = setTimeout(() => setIsHappy(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

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
                body: JSON.stringify({ message, targetUserId, chatContext })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.reply,
                    timestamp: new Date(),
                    toolsUsed: data.toolsUsed // Capture tools used by agentic AI
                }]);
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } else {
                const errorText = await res.text();
                console.error('Wingman chat error:', res.status, errorText);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Có lỗi xảy ra (${res.status}). Thử lại nhé! 💔`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Wingman chat failed:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Ối! Mình gặp sự cố rồi. Thử lại nhé! 💔',
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
                    .map((t: any) => `♦ ${t.tip}`)
                    .join('\n');
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `✨ Điểm Profile: ${data.overallScore}/100\n\n${tipsMessage}`,
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
                    ? `\n\n💡 Gợi ý:\n${data.contextHints.map((h: string) => `• ${h}`).join('\n')}`
                    : '';
                
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `💘 Câu mở đầu:\n\n${icebreakersList}${hintsText}`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to get icebreakers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getDateSpots = async () => {
        if (!token || !targetUserId) return;
        // Use agentic chat to get date spots
        await sendMessage('Gợi ý địa điểm hẹn hò cho mình và match này đi!');
    };

    const getWhoLikedMe = async () => {
        if (!token) return;
        await sendMessage('Ai đã like mình vậy?');
    };

    const quickActions = [
        { icon: Lightbulb, label: 'Cải thiện Profile', action: getProfileTips },
        { icon: Sparkles, label: 'Ai like mình?', action: getWhoLikedMe },
        ...(targetUserId ? [
            { icon: MessageSquare, label: 'Gợi ý mở đầu', action: getIcebreakers },
            { icon: MapPin, label: 'Địa điểm hẹn hò', action: getDateSpots },
        ] : []),
    ];

    return (
        <>
            {/* Drag constraints - full screen (only rendered on chat pages) */}
            {isDraggable && (
                <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-30" />
            )}
            
            {/* Cupid Button - Only draggable on chat pages */}
            <motion.div
                drag={isDraggable}
                dragConstraints={isDraggable ? constraintsRef : undefined}
                dragElastic={0.1}
                dragMomentum={false}
                whileDrag={isDraggable ? { scale: 1.1, cursor: 'grabbing' } : undefined}
                onDragEnd={isDraggable ? (_, info) => {
                    setPosition({ x: info.offset.x, y: info.offset.y });
                } : undefined}
                className={`fixed top-20 right-4 z-40 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                style={isDraggable ? { touchAction: 'none' } : undefined}
            >
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <div className="relative">
                        {/* Drag hint indicator - only show on chat pages */}
                        {isDraggable && (
                            <>
                                <div className="absolute -top-1 -left-1 w-2 h-2 bg-cocoa/30 rounded-full" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-cocoa/30 rounded-full" />
                            </>
                        )}
                        
                        {/* Button container */}
                        <div className={`flex items-center gap-2 px-3 py-2 bg-retro-paper border-2 border-cocoa rounded-xl shadow-pixel transition-all ${isOpen ? 'bg-pixel-pink/30' : 'hover:bg-pixel-pink/20'}`}>
                            <ChibiCupid className="w-8 h-8" isHappy={isHappy || isOpen} />
                            <span className="text-xs font-pixel text-cocoa hidden sm:block">Cupid</span>
                            {!isOpen && (
                                <motion.span 
                                    className="text-[10px] text-pixel-pink"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    💕
                                </motion.span>
                            )}
                        </div>
                    </div>
                </motion.button>
            </motion.div>

            {/* Side Panel - Slides in from right, doesn't overlay chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-16 right-0 bottom-0 z-30 w-[320px] bg-retro-paper border-l-3 border-cocoa shadow-pixel-lg flex flex-col overflow-hidden"
                    >
                        {/* Header with Chibi */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-retro-white border-b-3 border-cocoa">
                            <div className="w-10 h-10 bg-pixel-pink/30 rounded-xl border-2 border-cocoa flex items-center justify-center">
                                <ChibiCupid className="w-9 h-9" isHappy={isHappy} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-pixel text-base text-cocoa leading-none">Cupid</h3>
                                <p className="text-[10px] text-cocoa-light">Trợ lý hẹn hò của bạn 💘</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={clearHistory}
                                    className="p-1.5 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/10 rounded-lg transition-colors"
                                    title="Xóa lịch sử"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-cocoa/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%222%22%20cy%3D%222%22%20r%3D%221%22%20fill%3D%22%2362544B%22%20opacity%3D%220.1%22%2F%3E%3C%2Fsvg%3E')]">
                            {messages.length === 0 ? (
                                <div className="text-center py-6">
                                    <motion.div
                                        animate={{ y: [0, -5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <ChibiCupid className="w-20 h-20 mx-auto mb-3 opacity-60" />
                                    </motion.div>
                                    <p className="text-sm text-cocoa-light mb-1">
                                        Chào bạn! Mình là Cupid 💕
                                    </p>
                                    <p className="text-xs text-cocoa-light/70 mb-4">
                                        Hỏi mình bất cứ điều gì về hẹn hò nhé!
                                    </p>
                                    
                                    {/* Quick Actions */}
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {quickActions.map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={action.action}
                                                disabled={isLoading}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-retro-white text-cocoa rounded-lg border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-pink/20 hover:-translate-y-0.5 hover:shadow-pixel transition-all disabled:opacity-50 font-medium"
                                            >
                                                <action.icon className="w-3.5 h-3.5" />
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 mr-1.5 flex-shrink-0">
                                                <ChibiCupid className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className="max-w-[85%]">
                                            {/* Tool indicator for agentic actions */}
                                            {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                                                <div className="flex items-center gap-1 mb-1 text-[10px] text-pixel-purple">
                                                    <Wand2 className="w-3 h-3" />
                                                    <span>Đã thực hiện: {msg.toolsUsed.length} hành động</span>
                                                </div>
                                            )}
                                            <div className={`px-3 py-2 text-sm whitespace-pre-wrap border-2 ${
                                                msg.role === 'user'
                                                    ? 'bg-pixel-pink/30 text-cocoa border-cocoa rounded-2xl rounded-br-md shadow-pixel-sm'
                                                    : 'bg-retro-white text-cocoa border-cocoa rounded-2xl rounded-bl-md shadow-pixel-sm'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="w-6 h-6 mr-1.5">
                                        <ChibiCupid className="w-6 h-6" isHappy />
                                    </div>
                                    <div className="bg-retro-white border-2 border-cocoa rounded-2xl rounded-bl-md shadow-pixel-sm">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions */}
                        {suggestions.length > 0 && (
                            <div className="px-3 py-2 border-t-2 border-cocoa/20 bg-retro-white/50">
                                <div className="flex flex-wrap gap-1.5">
                                    {suggestions.slice(0, 3).map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => sendMessage(s)}
                                            className="text-[11px] px-2 py-1 bg-pixel-yellow/30 text-cocoa rounded-lg border border-cocoa/30 hover:bg-pixel-yellow/50 hover:border-cocoa transition-colors truncate max-w-[100px]"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-3 border-t-3 border-cocoa bg-retro-white">
                            <form 
                                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Nhắn gì cho Cupid..."
                                    className="flex-1 px-3 py-2 text-sm bg-retro-paper border-2 border-cocoa rounded-xl focus:border-pixel-pink focus:bg-retro-white outline-none transition-colors placeholder:text-cocoa-light/50"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-pixel-pink text-cocoa rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark disabled:opacity-50 transition-all active:translate-y-0.5 active:shadow-none"
                                >
                                    <Heart className="w-4 h-4 fill-current" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
