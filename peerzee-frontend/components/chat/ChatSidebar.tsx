'use client';

import React from 'react';
import Link from 'next/link';
import { SquarePen, Search, Sun, Moon, LogOut, User } from 'lucide-react';

interface Conversation {
    id: string;
    type: string;
    lastMessageAt: string | null;
    lastSeq: string;
    name?: string;
    lastMessage?: string;
    participantIds?: string[];
}

interface ChatSidebarProps {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    userId: string | null;
    isConnected: boolean;
    theme: string;
    unreadCounts: Record<string, number>;
    onlineUsers: Set<string>;
    typingUsers: Record<string, string[]>;
    userNames: Record<string, string>;
    onSelectConversation: (conv: Conversation) => void;
    onNewChat: () => void;
    onToggleTheme: () => void;
    onLogout: () => void;
}

type FilterTab = 'all' | 'unread';

/**
 * ChatSidebar - Cozy Clay Theme (ToyWorld Style)
 * Features: Warm pink palette, rounded pill shapes, soft shadows
 */
export default function ChatSidebar({
    conversations,
    activeConversation,
    userId,
    isConnected,
    theme,
    unreadCounts,
    onlineUsers,
    typingUsers,
    userNames,
    onSelectConversation,
    onNewChat,
    onToggleTheme,
    onLogout,
}: ChatSidebarProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [activeFilter, setActiveFilter] = React.useState<FilterTab>('all');

    // Filter conversations based on search and filter tab
    const filteredConversations = React.useMemo(() => {
        let filtered = conversations;

        // Search filter
        if (searchQuery.trim()) {
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Tab filter
        if (activeFilter === 'unread') {
            filtered = filtered.filter(c => unreadCounts[c.id] > 0);
        }

        return filtered;
    }, [conversations, searchQuery, activeFilter, unreadCounts]);

    // Format timestamp for conversation list
    const formatTime = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Get typing indicator text
    const getTypingText = (conversationId: string) => {
        const typing = typingUsers[conversationId] || [];
        if (typing.length === 0) return null;
        if (typing.length === 1) {
            return `${userNames[typing[0]] || 'Someone'} is typing`;
        }
        return `${typing.length} people typing`;
    };

    return (
        <div className="w-[320px] h-full shrink-0 bg-[#FDF0F1] rounded-[40px] shadow-xl shadow-[#CD6E67]/10 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[#ECC8CD]/30">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <h1 className="text-[#3E3229] font-extrabold text-3xl font-[family-name:var(--font-nunito)]">Messages</h1>
                        <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isConnected ? 'bg-green-500' : 'bg-[#7A6862]'}`} />
                    </div>
                    <button
                        onClick={onNewChat}
                        className="w-12 h-12 bg-[#CD6E67] text-white rounded-full shadow-md shadow-[#CD6E67]/30 transition-all flex items-center justify-center hover:scale-105 active:scale-95 hover:bg-[#B55B55]"
                        title="New message"
                    >
                        <SquarePen className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input - Pill shaped */}
                <div className="relative mb-4">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full bg-[#F3DDE0] border-none text-[#3E3229] placeholder-[#9CA3AF] rounded-full pl-11 pr-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#CD6E67] transition-all"
                    />
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-[#7A6862] hover:text-[#3E3229] hover:bg-[#F3DDE0] rounded-full transition-colors"
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <Link
                            href="/profile"
                            className="p-2 text-[#7A6862] hover:text-[#3E3229] hover:bg-[#F3DDE0] rounded-full transition-colors"
                            title="Profile"
                        >
                            <User className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={onLogout}
                            className="p-2 text-[#7A6862] hover:text-[#CD6E67] hover:bg-[#F8E3E6] rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex bg-white rounded-full p-1 shadow-sm">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === 'all'
                                ? 'bg-[#CD6E67] text-white shadow-md shadow-[#CD6E67]/30'
                                : 'text-[#7A6862] hover:text-[#3E3229]'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeFilter === 'unread'
                                ? 'bg-[#CD6E67] text-white shadow-md shadow-[#CD6E67]/30'
                                : 'text-[#7A6862] hover:text-[#3E3229]'
                                }`}
                        >
                            Unread
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto px-2">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                            <Search className="w-7 h-7 text-[#CD6E67]" />
                        </div>
                        <p className="text-[#7A6862] text-sm text-center font-medium">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const otherUserId = conv.participantIds?.find(id => id !== userId) || '';
                        const isActive = activeConversation?.id === conv.id;
                        const isOnline = onlineUsers.has(otherUserId);
                        const typingText = getTypingText(conv.id);
                        const unreadCount = unreadCounts[conv.id] || 0;

                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv)}
                                className={`p-4 mb-2 rounded-[20px] cursor-pointer transition-all flex gap-3 items-center ${isActive
                                    ? 'bg-white shadow-sm'
                                    : 'hover:bg-[#F8E3E6]'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className={`w-14 h-14 rounded-full bg-[#CD6E67] flex items-center justify-center text-white font-extrabold text-base shadow-sm border-2 border-white`}>
                                        {conv.name?.slice(0, 1)?.toUpperCase() || '?'}
                                    </div>
                                    {/* Online indicator */}
                                    {isOnline && (
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-bold text-sm truncate ${isActive ? 'text-[#3E3229]' : 'text-[#3E3229]'}`}>
                                            {conv.name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-[#7A6862] shrink-0 font-medium">
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        {typingText ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-[#CD6E67] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-[#CD6E67] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1.5 h-1.5 bg-[#CD6E67] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-xs text-[#7A6862] italic truncate">
                                                    {typingText}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-[#7A6862] truncate">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1.5 bg-[#CD6E67] text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Navigation */}
            <div className="p-4 border-t border-[#ECC8CD]/30">
                <div className="flex gap-2">
                    <Link
                        href="/discover"
                        className="flex-1 py-2.5 text-xs font-bold text-[#7A6862] hover:text-white bg-white hover:bg-[#CD6E67] rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#CD6E67]/20"
                        title="Discover"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        Discover
                    </Link>
                    <Link
                        href="/community"
                        className="flex-1 py-2.5 text-xs font-bold text-[#7A6862] hover:text-white bg-white hover:bg-[#CD6E67] rounded-full transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#CD6E67]/20"
                        title="Community"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Community
                    </Link>
                    <Link
                        href="/video-dating"
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-[#CD6E67] hover:bg-[#B55B55] rounded-full transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#CD6E67]/30"
                        title="Video Dating"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video
                    </Link>
                </div>
            </div>
        </div>
    );
}
