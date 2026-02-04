'use client';

import React from 'react';
import Link from 'next/link';
import { PenLine, Search, Sun, Moon, LogOut, IdCard, Wifi, WifiOff, Heart, Users, Video } from 'lucide-react';

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
 * ChatSidebar - Retro Pixel OS Style
 * Features: Pixel borders, 8-bit aesthetic, shadow-pixel
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

    // Filter and sort conversations based on search, filter tab, and last message time
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

        // Sort by lastMessageAt (most recent first)
        filtered = [...filtered].sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
        });

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
        <div className="w-[320px] h-full shrink-0 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b-3 border-cocoa">
                {/* Title Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="font-pixel text-cocoa text-xl uppercase tracking-widest">Messages</h1>
                        <span className={`w-3 h-3 border-2 border-cocoa rounded transition-colors ${isConnected ? 'bg-pixel-green' : 'bg-cocoa-light'}`} />
                    </div>
                    <button
                        onClick={onNewChat}
                        className="w-10 h-10 bg-pixel-pink border-2 border-cocoa text-cocoa rounded-lg shadow-pixel-sm transition-all flex items-center justify-center hover:bg-pixel-pink-dark active:translate-y-0.5 active:shadow-none"
                        title="New message"
                    >
                        <PenLine className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Search Input - Pixel styled */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cocoa-light" strokeWidth={2.5} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full bg-retro-white border-3 border-cocoa text-cocoa placeholder-cocoa-light rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pixel-pink shadow-pixel-inset font-bold"
                    />
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-yellow border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" strokeWidth={2.5} /> : <Sun className="w-4 h-4" strokeWidth={2.5} />}
                        </button>
                        <Link
                            href="/profile"
                            className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                            title="Profile"
                        >
                            <IdCard className="w-4 h-4" strokeWidth={2.5} />
                        </Link>
                        <button
                            onClick={onLogout}
                            className="p-2 text-cocoa-light hover:text-pixel-red hover:bg-pixel-red/20 border-2 border-transparent hover:border-pixel-red rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex bg-retro-bg border-2 border-cocoa rounded-lg p-1">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 text-xs font-pixel uppercase tracking-wider rounded-md transition-all ${activeFilter === 'all'
                                ? 'bg-pixel-blue border-2 border-cocoa shadow-pixel-sm text-cocoa'
                                : 'text-cocoa-light hover:text-cocoa border-2 border-transparent'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={`px-3 py-1.5 text-xs font-pixel uppercase tracking-wider rounded-md transition-all ${activeFilter === 'unread'
                                ? 'bg-pixel-pink border-2 border-cocoa shadow-pixel-sm text-cocoa'
                                : 'text-cocoa-light hover:text-cocoa border-2 border-transparent'
                                }`}
                        >
                            Unread
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 border-3 border-cocoa rounded-xl bg-pixel-blue flex items-center justify-center mb-4 shadow-pixel-sm">
                            <Search className="w-7 h-7 text-cocoa" />
                        </div>
                        <p className="text-cocoa-light text-sm text-center font-bold">
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
                                className={`p-3 mb-2 border-2 rounded-lg cursor-pointer transition-all flex gap-3 items-center ${isActive
                                    ? 'bg-pixel-blue border-cocoa shadow-pixel-sm'
                                    : 'bg-retro-white border-transparent hover:border-cocoa hover:bg-retro-bg'
                                    }`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    <div className={`w-12 h-12 border-2 border-cocoa rounded-lg bg-pixel-pink flex items-center justify-center text-cocoa font-pixel text-sm shadow-pixel-sm`}>
                                        {conv.name?.slice(0, 1)?.toUpperCase() || '?'}
                                    </div>
                                    {/* Online indicator */}
                                    {isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pixel-green border-2 border-cocoa rounded" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`font-bold text-sm truncate ${isActive ? 'text-cocoa' : 'text-cocoa'}`}>
                                            {conv.name || 'Unknown'}
                                        </span>
                                        <span className="text-[10px] text-cocoa-light shrink-0 font-bold">
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        {typingText ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                                <span className="text-xs text-cocoa-light italic truncate font-medium">
                                                    {typingText}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-cocoa-light truncate font-medium">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="min-w-[20px] h-[20px] px-1.5 bg-pixel-red border-2 border-cocoa text-white rounded-md text-[10px] font-pixel flex items-center justify-center shrink-0">
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
            <div className="p-3 border-t-3 border-cocoa">
                <div className="flex gap-2">
                    <Link
                        href="/discover"
                        className="flex-1 py-2.5 text-xs font-pixel uppercase tracking-wider text-cocoa bg-retro-white hover:bg-pixel-pink border-2 border-cocoa rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                        title="Discover"
                    >
                        <Heart className="w-4 h-4" strokeWidth={2.5} />
                        Discover
                    </Link>
                    <Link
                        href="/community"
                        className="flex-1 py-2.5 text-xs font-pixel uppercase tracking-wider text-cocoa bg-retro-white hover:bg-pixel-blue border-2 border-cocoa rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                        title="Community"
                    >
                        <Users className="w-4 h-4" strokeWidth={2.5} />
                        Community
                    </Link>
                    <Link
                        href="/match"
                        className="flex-1 py-2.5 text-xs font-pixel uppercase tracking-wider text-cocoa bg-pixel-green border-2 border-cocoa rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-pixel-sm hover:bg-green-400 active:translate-y-0.5 active:shadow-none"
                        title="Arcade Match"
                    >
                        <Video className="w-4 h-4" strokeWidth={2.5} />
                        Match
                    </Link>
                </div>
            </div>
        </div>
    );
}
