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
                h-full flex flex-col bg-white
                transition-all duration-300 ease-in-out overflow-hidden
                ${isOpen
                    ? 'w-96 opacity-100 flex-shrink-0 border-l border-gray-200'
                    : 'w-0 opacity-0 flex-shrink-0'
                }
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 tracking-tight">AI Wingman</span>
                    {wingmanMessages.length > 0 && (
                        <span className="text-xs text-gray-400 font-normal">
                            {wingmanMessages.length} gợi ý
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {wingmanMessages.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center">
                            <Bot className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-gray-600">Wingman sẵn sàng!</p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Gõ{' '}
                                <code className="bg-gray-100 border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">
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
                                        <div className="flex-1 h-px bg-gray-200" />
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                                            Gợi ý #{i + 1}
                                        </span>
                                        <div className="flex-1 h-px bg-gray-200" />
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
            <div className="px-4 py-2.5 border-t border-gray-100 bg-white shrink-0">
                <p className="text-[10px] text-gray-400 text-center">
                    Powered by Gemini + OpenStreetMap
                </p>
            </div>
        </div>
    );
}
