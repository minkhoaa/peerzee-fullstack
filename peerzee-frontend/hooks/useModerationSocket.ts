'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { type FeedResponse } from '@/lib/communityApi';
import { postKeys } from './usePosts';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModerationResultEvent {
    status: 'approved' | 'rejected';
    contentId: string;
    contentType: 'post' | 'comment';
    violationType: 'BLACKLIST' | 'AI_DETECTED' | null;
    reason: string | null;
}

export interface UseModerationSocketOptions {
    /** Called when a post/comment is REJECTED — show the RPG Guard modal */
    onRejected?: (event: ModerationResultEvent) => void;
    /** Called when a post is APPROVED — animate it from pending → visible */
    onApproved?: (event: ModerationResultEvent) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useModerationSocket
 *
 * Subscribes to the `moderation_result` WebSocket event emitted by the backend
 * after Gemini or blacklist moderation completes.
 *
 * Behaviour:
 *  - Approved post  → update its status in TanStack Query cache to 'approved'
 *  - Rejected post  → remove it from the cache, fire onRejected callback
 */
export function useModerationSocket(options?: UseModerationSocketOptions) {
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);
    const onRejectedRef = useRef(options?.onRejected);
    const onApprovedRef = useRef(options?.onApproved);

    // Keep callback refs up-to-date without re-running the effect
    useEffect(() => {
        onRejectedRef.current = options?.onRejected;
    }, [options?.onRejected]);
    useEffect(() => {
        onApprovedRef.current = options?.onApproved;
    }, [options?.onApproved]);

    const updatePostCache = useCallback(
        (contentId: string, status: 'approved' | 'rejected') => {
            queryClient.setQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed(),
                (old) => {
                    if (!old) return old;

                    const newPages = old.pages.map((page) => {
                        const posts = page.data || page.posts || [];

                        const updated = posts
                            // For rejected: remove entirely. For approved: update status field.
                            .filter((p) => !(p.id === contentId && status === 'rejected'))
                            .map((p) => {
                                if (p.id === contentId && status === 'approved') {
                                    return { ...p, status: 'approved' as const };
                                }
                                return p;
                            });

                        return { ...page, data: updated };
                    });

                    return { ...old, pages: newPages };
                },
            );
        },
        [queryClient],
    );

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) return;

        const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
        const socket = io(`${baseUrl}/socket/chat`, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[ModerationSocket] connected');
        });

        socket.on('moderation_result', (event: ModerationResultEvent) => {
            console.log('[ModerationSocket] moderation_result', event);

            if (event.contentType === 'post') {
                updatePostCache(event.contentId, event.status);
            }

            if (event.status === 'rejected') {
                onRejectedRef.current?.(event);
            } else {
                onApprovedRef.current?.(event);
            }
        });

        socket.on('disconnect', () => {
            console.log('[ModerationSocket] disconnected');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [updatePostCache]);

    return { socket: socketRef.current };
}
