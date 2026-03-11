'use client';

import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Bot } from 'lucide-react';
import WingmanMessageCard from './WingmanMessageCard';

const WINGMAN_SENDER_ID = '00000000-0000-0000-0000-000000000001';

interface Message {
    id: string;
    sender_id: string;
    body: string;
}

interface WingmanSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
}

export default function WingmanSidebar({ isOpen, onClose, messages }: WingmanSidebarProps) {
    const wingmanMessages = messages.filter(m => m.sender_id === WINGMAN_SENDER_ID);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest when new wingman message arrives
    useEffect(() => {
        if (isOpen && wingmanMessages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [wingmanMessages.length, isOpen]);

    return (
        <div
            className={`
                h-full flex flex-col bg-retro-white
                transition-all duration-300 ease-in-out overflow-hidden
                ${isOpen
                    ? 'w-96 opacity-100 flex-shrink-0 border-l-2 border-cocoa/20'
                    : 'w-0 opacity-0 flex-shrink-0'
                }
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-cocoa/15 bg-retro-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pixel-purple/20 border border-pixel-purple/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-pixel-purple" />
                    </div>
                    <span className="text-sm font-pixel text-cocoa tracking-wide uppercase">AI Wingman</span>
                    {wingmanMessages.length > 0 && (
                        <span className="text-xs text-cocoa-light font-normal">
                            {wingmanMessages.length} gợi ý
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-cocoa/10 text-cocoa-light hover:text-cocoa transition-colors"
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-retro-paper">
                {wingmanMessages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-pixel-purple/10 border border-pixel-purple/20 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-pixel-purple" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-cocoa">Wingman sẵn sàng!</p>
                            <p className="text-xs text-cocoa-light leading-relaxed">
                                Gõ{' '}
                                <code className="bg-retro-paper border border-cocoa/20 text-cocoa px-1.5 py-0.5 rounded text-xs font-mono">
                                    @Wingman
                                </code>
                                {' '}trong chat để nhận gợi ý địa điểm hẹn hò phù hợp.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Wingman message list */
                    <div className="py-3 space-y-1">
                        {wingmanMessages.map((m, i) => (
                            <div key={m.id}>
                                {/* Session divider between multiple Wingman calls */}
                                {i > 0 && (
                                    <div className="flex items-center gap-2 px-4 py-2">
                                        <div className="flex-1 h-px bg-cocoa/20" />
                                        <span className="text-[10px] text-cocoa-light uppercase tracking-widest font-medium">
                                            Gợi ý #{i + 1}
                                        </span>
                                        <div className="flex-1 h-px bg-cocoa/20" />
                                    </div>
                                )}
                                {/* Render without the bot avatar wrapper — sidebar header handles identity */}
                                <WingmanMessageCard body={m.body} compact />
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 border-t-2 border-cocoa/15 bg-retro-white shrink-0">
                <p className="text-[10px] text-cocoa-light text-center">
                    Powered by Gemini + OpenStreetMap
                </p>
            </div>
        </div>
    );
}
