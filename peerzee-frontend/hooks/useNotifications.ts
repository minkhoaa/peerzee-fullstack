'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

interface NotificationData {
    postId?: string;
    matchId?: string;
    conversationId?: string;
    userId?: string;
    userName?: string;
    userAvatar?: string;
    [key: string]: unknown;
}

export interface Notification {
    id: string;
    type: 'MATCH' | 'LIKE_POST' | 'COMMENT' | 'SUPER_LIKE' | 'MESSAGE' | 'SYSTEM';
    title: string;
    message: string;
    data: NotificationData;
    isRead: boolean;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: Notification[];
    nextCursor: string | null;
    unreadCount: number;
}

/**
 * useNotifications - Hook for fetching and managing notifications
 * Uses infinite query for pagination and socket for real-time updates
 */
export function useNotifications() {
    const queryClient = useQueryClient();
    const [unreadCount, setUnreadCount] = useState(0);
    const [socketRef, setSocketRef] = useState<Socket | null>(null);

    // Fetch notifications with cursor-based pagination
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['notifications'],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (pageParam) params.set('cursor', pageParam);
            params.set('limit', '20');

            const res = await api.get<NotificationsResponse>(`/notifications?${params}`);
            return res.data;
        },
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialPageParam: undefined as string | undefined,
    });

    // Update unread count when data changes
    useEffect(() => {
        if (data?.pages?.[0]) {
            setUnreadCount(data.pages[0].unreadCount);
        }
    }, [data]);

    // Socket connection for real-time notifications
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
        const socket = io(`${baseUrl}/socket/chat`, {
            auth: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Notification socket connected');
        });

        socket.on('new_notification', (notification: Notification) => {
            console.log('New notification received:', notification);

            // Increment unread count
            setUnreadCount((prev) => prev + 1);

            // Invalidate query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        socket.on('disconnect', () => {
            console.log('Notification socket disconnected');
        });

        setSocketRef(socket);

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    // Flatten notifications from all pages
    const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

    // Mark single notification as read
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await api.patch(`/notifications/${notificationId}/read`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    // Mark all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            const res = await api.patch('/notifications/read-all');
            return res.data;
        },
        onSuccess: () => {
            setUnreadCount(0);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAsRead = useCallback(
        (notificationId: string) => {
            markAsReadMutation.mutate(notificationId);
        },
        [markAsReadMutation]
    );

    const markAllAsRead = useCallback(() => {
        markAllAsReadMutation.mutate();
    }, [markAllAsReadMutation]);

    return {
        notifications,
        unreadCount,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        markAsRead,
        markAllAsRead,
        refetch,
    };
}
