'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Heart, MessageCircle, Sparkles, AlertCircle, X } from 'lucide-react';
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

    // Get icon based on notification type
    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'MATCH':
                return <Heart className="w-4 h-4 text-pink-500" />;
            case 'LIKE_POST':
                return <Heart className="w-4 h-4 text-red-500" />;
            case 'COMMENT':
                return <MessageCircle className="w-4 h-4 text-blue-500" />;
            case 'SUPER_LIKE':
                return <Sparkles className="w-4 h-4 text-yellow-500" />;
            case 'MESSAGE':
                return <MessageCircle className="w-4 h-4 text-purple-500" />;
            case 'SYSTEM':
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
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
                className="relative p-2 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-[#202020] border border-[#2F2F2F] rounded-xl shadow-2xl overflow-hidden overflow-x-hidden z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2F2F2F]">
                        <h3 className="text-sm font-semibold text-[#E3E3E3]">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors"
                                >
                                    <CheckCheck className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[380px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-[#9B9A97]">
                                <Bell className="w-10 h-10 mb-3 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#2F2F2F] transition-colors ${!notification.isRead ? 'bg-[#262626]' : ''
                                            }`}
                                    >
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#E3E3E3] truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-[#9B9A97] line-clamp-2 mt-0.5">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-[#6B6B6B] mt-1">
                                                {formatTimeAgo(notification.createdAt)}
                                            </p>
                                        </div>

                                        {/* Unread indicator */}
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2" />
                                        )}
                                    </button>
                                ))}

                                {/* Load More */}
                                {hasNextPage && (
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="w-full py-3 text-xs text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] transition-colors"
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
