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
 * ChatSidebar - Soft Light Mode sidebar with clean, airy design
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
        <div className="w-[320px] shrink-0 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-xl shadow-rose-500/5 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/40">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-zinc-900 font-bold text-2xl">Messages</h1>
                        <span className={`w-2 h-2 rounded-full transition-colors ${isConnected ? 'bg-green-500' : 'bg-zinc-400'}`} />
                    </div>
                    <button
                        onClick={onNewChat}
                        className="w-10 h-10 bg-gradient-to-r from-rose-500 to-rose-400 text-white rounded-full shadow-lg shadow-rose-500/30 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                        title="New message"
                    >
                        <SquarePen className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Input - Pill shaped */}
                <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full bg-white/50 border border-white/50 text-zinc-800 placeholder-zinc-400 rounded-full pl-11 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200/50 focus:bg-white transition-all"
                    />
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <Link
                            href="/profile"
                            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            title="Profile"
                        >
                            <User className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={onLogout}
                            className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex bg-white/50 backdrop-blur-sm rounded-full p-0.5 border border-white/40">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${activeFilter === 'all'
                                ? 'bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/30'
                                : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${activeFilter === 'unread'
                                ? 'bg-gradient-to-r from-rose-500 to-rose-400 text-white shadow-md shadow-rose-500/30'
                                : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                        >
                            Unread
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                            <Search className="w-5 h-5 text-zinc-400" />
                        </div>
                        <p className="text-zinc-500 text-sm text-center">
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
                                className={`p-3 mx-2 mb-1 rounded-2xl cursor-pointer transition-all flex gap-3 items-center ${isActive
                                    ? 'bg-rose-50 border border-rose-100'
                                    : 'hover:bg-zinc-50'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm shadow-sm border border-zinc-100`}>
                                        {conv.name?.slice(0, 1)?.toUpperCase() || '?'}
                                    </div>
                                    {/* Online indicator */}
                                    {isOnline && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-semibold text-sm truncate ${isActive ? 'text-zinc-900' : 'text-zinc-900'}`}>
                                            {conv.name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 shrink-0">
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        {typingText ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="flex gap-0.5">
                                                    <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-xs text-zinc-500 italic truncate">
                                                    {typingText}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-zinc-500 truncate">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Quick Navigation */}
            <div className="p-3 border-t border-zinc-100">
                <div className="flex gap-2">
                    <Link
                        href="/discover"
                        className="flex-1 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        title="Discover"
                    >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        Discover
                    </Link>
                    <Link
                        href="/community"
                        className="flex-1 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        title="Community"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Community
                    </Link>
                    <Link
                        href="/video-dating"
                        className="flex-1 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        title="Video Dating"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Video
                    </Link>
                </div>
            </div>
        </div>
    );
}
