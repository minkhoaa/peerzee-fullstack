'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { SquarePen, Search, Sun, Moon, LogOut, User, MessageSquareText } from 'lucide-react';
import { clsx } from 'clsx';

interface Conversation {
    id: string;
    type: string;
    lastMessageAt: string | null;
    lastSeq: string;
    name?: string;
    lastMessage?: string;
    participantIds?: string[];
    affinityScore?: number;
}

interface RPGChatSidebarProps {
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
 * RPGChatSidebar - Pixel RPG styled sidebar
 * Features: Retro window chrome, pixel borders, level indicators
 */
export default function RPGChatSidebar({
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
}: RPGChatSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        if (searchQuery.trim()) {
            filtered = filtered.filter(c =>
                c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (activeFilter === 'unread') {
            filtered = filtered.filter(c => unreadCounts[c.id] > 0);
        }

        return filtered;
    }, [conversations, searchQuery, activeFilter, unreadCounts]);

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

    const getTypingText = (conversationId: string) => {
        const typing = typingUsers[conversationId] || [];
        if (typing.length === 0) return null;
        if (typing.length === 1) {
            return `${userNames[typing[0]] || 'Someone'} typing...`;
        }
        return `${typing.length} players typing...`;
    };

    // Calculate level from affinity score
    const getLevel = (conv: Conversation) => {
        const score = conv.affinityScore || 0;
        return Math.floor(score / 20) + 1;
    };

    return (
        <div className="w-[320px] h-full shrink-0 bg-white border-4 border-rpg-brown shadow-pixel flex flex-col overflow-hidden">
            {/* Window Title Bar */}
            <div className="bg-rpg-brown px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white text-sm flex items-center gap-1.5"><MessageSquareText className="w-4 h-4" strokeWidth={2.5} /> MESSAGES</span>
                    <span className={clsx(
                        'w-2 h-2',
                        isConnected ? 'bg-green-400' : 'bg-red-400'
                    )} />
                </div>
                <button
                    onClick={onNewChat}
                    className="px-2 py-1 bg-primary text-white text-xs font-display font-bold border-2 border-white/30 hover:bg-primary/80 transition-colors"
                    title="New message"
                >
                    + NEW
                </button>
            </div>

            {/* Search & Actions */}
            <div className="p-3 border-b-2 border-rpg-brown/20 bg-rpg-blue/30">
                {/* Search Input */}
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rpg-brown/50" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search players..."
                        className="w-full bg-white border-2 border-rpg-brown text-rpg-brown placeholder-rpg-brown/40 pl-10 pr-4 py-2 text-sm font-display focus:outline-none focus:ring-2 focus:ring-primary shadow-pixel-inset"
                    />
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        <button
                            onClick={onToggleTheme}
                            className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                            title="Toggle theme"
                        >
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <Link
                            href="/profile"
                            className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all flex items-center justify-center"
                            title="Profile"
                        >
                            <User className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={onLogout}
                            className="p-2 text-rpg-brown hover:text-red-500 hover:bg-red-50 border-2 border-transparent hover:border-red-300 transition-all"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex border-2 border-rpg-brown">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={clsx(
                                'px-3 py-1 text-xs font-display font-bold transition-all',
                                activeFilter === 'all'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-rpg-brown hover:bg-rpg-blue'
                            )}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('unread')}
                            className={clsx(
                                'px-3 py-1 text-xs font-display font-bold transition-all border-l-2 border-rpg-brown',
                                activeFilter === 'unread'
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-rpg-brown hover:bg-rpg-blue'
                            )}
                        >
                            Unread
                        </button>
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto rpg-scrollbar">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 bg-rpg-blue border-2 border-rpg-brown flex items-center justify-center mb-4">
                            <Search className="w-7 h-7 text-rpg-brown" />
                        </div>
                        <p className="text-rpg-brown/70 text-sm text-center font-display font-medium">
                            {searchQuery ? 'No players found' : 'No conversations yet'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const otherUserId = conv.participantIds?.find(id => id !== userId) || '';
                        const isOnline = onlineUsers.has(otherUserId);
                        const isActive = activeConversation?.id === conv.id;
                        const unreadCount = unreadCounts[conv.id] || 0;
                        const typingText = getTypingText(conv.id);
                        const level = getLevel(conv);

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv)}
                                className={clsx(
                                    'w-full p-3 text-left transition-all border-b-2 border-rpg-brown/10',
                                    isActive
                                        ? 'bg-primary-light border-l-4 border-l-primary'
                                        : 'hover:bg-rpg-blue/50'
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={clsx(
                                            'w-12 h-12 border-2 border-rpg-brown flex items-center justify-center font-display font-bold text-lg',
                                            isActive ? 'bg-primary text-white' : 'bg-rpg-blue text-rpg-brown'
                                        )}>
                                            {conv.name?.slice(0, 1)?.toUpperCase() || '?'}
                                        </div>
                                        
                                        {/* Online indicator */}
                                        {isOnline && (
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white" />
                                        )}
                                        
                                        {/* Level badge */}
                                        <div className="absolute -top-1 -right-1 px-1 bg-rpg-brown text-white text-[10px] font-display font-bold">
                                            L{level}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={clsx(
                                                'font-display font-bold text-sm truncate',
                                                isActive ? 'text-primary' : 'text-rpg-brown'
                                            )}>
                                                {conv.name || 'Unknown Player'}
                                            </span>
                                            <span className="text-[10px] text-rpg-brown/50 font-display shrink-0 ml-2">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            {typingText ? (
                                                <span className="text-xs text-primary font-display italic animate-pulse">
                                                    {typingText}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-rpg-brown/60 font-display truncate pr-2">
                                                    {conv.lastMessage || 'Start the adventure...'}
                                                </span>
                                            )}
                                            
                                            {/* Unread badge */}
                                            {unreadCount > 0 && (
                                                <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-white text-xs font-display font-bold flex items-center justify-center border border-rpg-brown">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-rpg-blue/30 border-t-2 border-rpg-brown/20">
                <p className="text-[10px] text-rpg-brown/50 font-display text-center">
                    {conversations.length} conversations • {onlineUsers.size} online
                </p>
            </div>
        </div>
    );
}
