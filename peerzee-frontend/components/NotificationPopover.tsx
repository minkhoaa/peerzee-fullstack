'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Star, MessageSquareText, Award, AlertCircle, X, ThumbsUp } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

// Simple time ago formatter (no external dependency)
function formatTimeAgo(dateString: string): string {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    } catch {
        return 'Just now';
    }
}

/**
 * NotificationPopover - Bell icon with dropdown showing notifications
 * Notion-style design with real-time updates
 */
export default function NotificationPopover() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Get icon based on notification type - Formal Professional Style
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'MATCH':
                return <Star className="w-4 h-4 text-pixel-pink" strokeWidth={2.5} />;
            case 'LIKE_POST':
                return <ThumbsUp className="w-4 h-4 text-pixel-green" strokeWidth={2.5} />;
            case 'COMMENT':
                return <MessageSquareText className="w-4 h-4 text-pixel-blue" strokeWidth={2.5} />;
            case 'SUPER_LIKE':
                return <Award className="w-4 h-4 text-pixel-yellow" strokeWidth={2.5} />;
            case 'MESSAGE':
                return <MessageSquareText className="w-4 h-4 text-pixel-purple" strokeWidth={2.5} />;
            case 'SYSTEM':
            default:
                return <AlertCircle className="w-4 h-4 text-cocoa-light" strokeWidth={2.5} />;
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        // Navigate based on type
        const { data } = notification;
        switch (notification.type) {
            case 'MATCH':
            case 'MESSAGE':
                if (data.conversationId) {
                    router.push(`/chat?c=${data.conversationId}`);
                } else {
                    router.push('/chat');
                }
                break;
            case 'LIKE_POST':
            case 'COMMENT':
                if (data.postId) {
                    router.push(`/community?post=${data.postId}`);
                } else {
                    router.push('/community');
                }
                break;
            default:
                break;
        }

        setIsOpen(false);
    };

    return (
        <div ref={popoverRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-cocoa hover:bg-pixel-yellow/30 border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-pixel text-retro-white bg-pixel-red border border-cocoa rounded-md">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[460px] bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden overflow-x-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b-3 border-cocoa bg-pixel-yellow/20">
                        <h3 className="text-sm font-pixel uppercase tracking-widest text-cocoa">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/30 rounded-md border border-transparent hover:border-cocoa transition-colors font-bold"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-cocoa-light hover:text-cocoa hover:bg-pixel-red/20 rounded-md transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[360px] bg-retro-paper">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-3 border-pixel-pink border-t-transparent rounded-lg animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-cocoa-light">
                                <Bell className="w-10 h-10 mb-3 opacity-50" />
                                <p className="text-sm font-bold">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-pixel-blue/20 transition-colors border-b border-cocoa/20 ${!notification.isRead ? 'bg-pixel-yellow/10' : ''
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-retro-white border border-cocoa">
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-cocoa truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-cocoa-light line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-cocoa-light mt-1 font-bold">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0 w-2 h-2 bg-pixel-pink border border-cocoa rounded mt-2" />
                                        )}
                                    </button>
                                ))}

                                {/* Load More */}
                                {hasNextPage && (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="w-full py-3 text-xs text-cocoa-light hover:text-cocoa hover:bg-pixel-purple/20 transition-colors font-bold"
                                    >
                                        {isFetchingNextPage ? 'Loading...' : 'Load more'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
