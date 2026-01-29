'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
 * NotificationPopover - Cute Retro OS styled notification bell
 * "Alert Window" - Game-like notification system
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
                return <Heart className="w-4 h-4 text-pixel-red fill-current" />;
            case 'LIKE_POST':
                return <Heart className="w-4 h-4 text-pixel-pink" />;
            case 'COMMENT':
                return <MessageCircle className="w-4 h-4 text-pixel-blue" />;
            case 'SUPER_LIKE':
                return <Sparkles className="w-4 h-4 text-pixel-yellow" />;
            case 'MESSAGE':
                return <MessageCircle className="w-4 h-4 text-pixel-green" />;
            case 'SYSTEM':
            default:
                return <AlertCircle className="w-4 h-4 text-cocoa-light" />;
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
            {/* Bell Button - Retro styled */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-cocoa hover:text-pixel-pink bg-white border-3 border-cocoa rounded-lg transition-colors shadow-[2px_2px_0_0_#5A3E36]"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />

                {/* Unread Badge - Pixel styled */}
                {unreadCount > 0 && (
                    <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 min-w-[20px] h-[20px] px-1 flex items-center justify-center font-pixel text-[10px] text-white bg-pixel-red border-2 border-cocoa rounded-lg shadow-[1px_1px_0_0_#5A3E36]"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                )}
            </motion.button>

            {/* Dropdown Popover - Retro Window styled */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-retro-paper border-4 border-cocoa rounded-xl shadow-[4px_4px_0_0_#8D6E63] overflow-hidden z-50"
                    >
                        {/* Window Title Bar */}
                        <div className="bg-pixel-yellow border-b-4 border-cocoa px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <span className="w-3 h-3 rounded-full bg-pixel-red border-2 border-cocoa" />
                                    <span className="w-3 h-3 rounded-full bg-pixel-yellow border-2 border-cocoa" />
                                    <span className="w-3 h-3 rounded-full bg-pixel-green border-2 border-cocoa" />
                                </div>
                                <h3 className="font-pixel text-cocoa text-sm uppercase ml-2">Alerts</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-cocoa hover:bg-pixel-pink/30 rounded-lg transition-colors font-pixel uppercase"
                                    >
                                        <CheckCheck className="w-3 h-3" />
                                        Read All
                                    </motion.button>
                                )}
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[380px]">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-cocoa-light border-t-pixel-pink rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-cocoa-light">
                                    <div className="w-16 h-16 bg-pixel-blue/20 border-3 border-cocoa rounded-lg flex items-center justify-center mb-3">
                                        <Bell className="w-8 h-8 text-cocoa-light" />
                                    </div>
                                    <p className="font-pixel text-sm uppercase">No alerts ✨</p>
                                </div>
                            ) : (
                                <>
                                    {notifications.map((notification, index) => (
                                        <motion.button
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-pixel-pink/20 border-b border-cocoa/20 transition-colors ${!notification.isRead ? 'bg-pixel-blue/10' : ''
                                                }`}
                                        >
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-white border-2 border-cocoa flex items-center justify-center shadow-[2px_2px_0_0_#8D6E63]">
                                                {getIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-pixel text-xs text-cocoa uppercase truncate">
                                                    {notification.title}
                                                </p>
                                                <p className="font-body text-xs text-cocoa-light line-clamp-2 mt-0.5">
                                                    {notification.message}
                                                </p>
                                                <p className="font-body text-[10px] text-cocoa-light/70 mt-1">
                                                    {formatTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>

                                            {/* Unread indicator */}
                                            {!notification.isRead && (
                                                <div className="flex-shrink-0 w-3 h-3 bg-pixel-pink border-2 border-cocoa rounded-full mt-2" />
                                            )}
                                        </motion.button>
                                    ))}

                                    {/* Load More */}
                                    {hasNextPage && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            className="w-full py-3 font-pixel text-xs text-cocoa uppercase hover:bg-pixel-blue/20 transition-colors"
                                        >
                                            {isFetchingNextPage ? 'Loading...' : 'Load More'}
                                        </motion.button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
