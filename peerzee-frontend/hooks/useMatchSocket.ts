'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface MatchNotification {
    matchId: string;
    conversationId: string;
    partnerProfile: {
        id: string;
        display_name: string;
        email: string;
    };
}

interface UseMatchSocketOptions {
    onMatchFound?: (notification: MatchNotification) => void;
    enabled?: boolean;
}

export function useMatchSocket(options: UseMatchSocketOptions = {}) {
    const { onMatchFound, enabled = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMatch, setLastMatch] = useState<MatchNotification | null>(null);

    // Use ref to avoid recreating connect on callback change
    const onMatchFoundRef = useRef(onMatchFound);
    onMatchFoundRef.current = onMatchFound;

    const connect = useCallback(() => {
        const token = localStorage.getItem('token');
        if (!token || !enabled) return;

        // Prevent duplicate connections
        if (socketRef.current?.connected) {
            return;
        }

        // Disconnect existing socket if any
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Connect to matching namespace
        const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
        const socket = io(`${baseUrl}/socket/matching`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[MatchSocket] Connected to matching namespace');
            setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('[MatchSocket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('[MatchSocket] Connection error:', error.message);
            setIsConnected(false);
        });

        // Listen for match notifications
        socket.on('match_found', (notification: MatchNotification) => {
            console.log('[MatchSocket] Match found:', notification);
            setLastMatch(notification);
            onMatchFoundRef.current?.(notification);
        });

        socketRef.current = socket;
    }, [enabled]); // Only depend on enabled

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
            setIsConnected(false);
        }
    }, []);

    // Clear last match
    const clearLastMatch = useCallback(() => {
        setLastMatch(null);
    }, []);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        connect();
        return () => disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]); // Only reconnect when enabled changes

    return {
        isConnected,
        lastMatch,
        clearLastMatch,
        connect,
        disconnect,
    };
}
