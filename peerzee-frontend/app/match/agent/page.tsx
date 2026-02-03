'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptDeck } from '@/components/match/PromptDeck';
import { AgentTerminal } from '@/components/match/AgentTerminal';
import { MatchResultCard } from '@/components/match/MatchResultCard';
import { WaitingState } from '@/components/match/WaitingState';
import { useMatchAgent } from '@/hooks/useMatchAgent';
import { ArrowLeft, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

type ConsoleMode = 'IDLE' | 'PROCESSING' | 'WAITING' | 'REVIEWING' | 'NAVIGATING';
type UserRole = 'INITIATOR' | 'RECEIVER' | null;

interface MatchPartner {
    id: string;
    display_name: string;
    query?: string;
}

/**
 * AI Matchmaking Console Page
 * Real-time Synchronized Matching
 */
export default function AgentMatchPage() {
    const router = useRouter();
    const [consoleMode, setConsoleMode] = useState<ConsoleMode>('IDLE');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [queuePosition, setQueuePosition] = useState(1);
    const [totalInQueue, setTotalInQueue] = useState(1);
    const [estimatedWait, setEstimatedWait] = useState('< 1 min');
    const [role, setRole] = useState<UserRole>(null);
    const [matchPartner, setMatchPartner] = useState<MatchPartner | null>(null);
    const [reasoning, setReasoning] = useState<string>('');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const { loading, error, result, steps, runAgent, reset } = useMatchAgent();

    // Initialize Socket.IO connection
    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:9000';
        const newSocket = io(`${socketUrl}/match-queue`, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            const userId = localStorage.getItem('userId');
            if (userId) {
                newSocket.emit('register', userId);
                console.log('📝 Registered userId:', userId);
            } else {
                console.error('❌ No userId in localStorage!');
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });

        // Event 1: QUEUE_UPDATE - Live position updates
        newSocket.on('QUEUE_UPDATE', (data: { myPosition: number; totalInQueue: number; estimatedWait: string }) => {
            console.log('📊 Queue update:', data);
            setQueuePosition(data.myPosition);
            setTotalInQueue(data.totalInQueue);
            setEstimatedWait(data.estimatedWait);
        });

        // Event 2: MATCH_PROPOSED - Dual notification
        newSocket.on('MATCH_PROPOSED', (data: { role: 'INITIATOR' | 'RECEIVER'; partner: MatchPartner; reasoning: string; roomId: string }) => {
            console.log('🎉 Match proposed!', data);
            setRole(data.role);
            setMatchPartner(data.partner);
            setReasoning(data.reasoning);
            setRoomId(data.roomId);
            setConsoleMode('REVIEWING');
        });

        // Event 3: GO_TO_ROOM - Synchronized navigation
        newSocket.on('GO_TO_ROOM', (data: { roomId: string; url: string }) => {
            console.log('🚀 Navigating to room:', data);
            setConsoleMode('NAVIGATING');

            // Countdown before redirect
            let count = 3;
            setCountdown(count);
            const interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count === 0) {
                    clearInterval(interval);
                    router.push(data.url);
                }
            }, 1000);
        });

        // Event 4: PARTNER_DISCONNECTED - Partner left
        newSocket.on('PARTNER_DISCONNECTED', (data: { message: string }) => {
            console.log('😢 Partner disconnected:', data);
            setConsoleMode('WAITING');
            setMatchPartner(null);
            setRole(null);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [router]);

    const handleSubmitQuery = async (query: string, interests: string[]) => {
        setConsoleMode('PROCESSING');
        const matchResult = await runAgent(query);

        // Check if added to queue
        if (matchResult && (matchResult as any).inQueue) {
            setConsoleMode('WAITING');
            return;
        }

        // If immediate database match found
        if (matchResult && matchResult.match) {
            const match = matchResult.match; // Extract for type safety

            // Generate roomId for immediate match
            const generatedRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            setTimeout(() => {
                setConsoleMode('REVIEWING');
                setRole('INITIATOR');
                setMatchPartner({
                    id: match.profile.id,
                    display_name: match.profile.display_name,
                });
                setReasoning(match.reasoning || '');
                setRoomId((matchResult as any).roomId || generatedRoomId);

                console.log('✅ Set roomId for immediate match:', generatedRoomId);
            }, 1000);
        } else if (error) {
            // Stay in PROCESSING to show error
        }
    };

    const handleAcceptMatch = () => {
        console.log('📨 handleAcceptMatch called');
        console.log('  Socket:', socket?.connected ? 'Connected' : 'Disconnected');
        console.log('  RoomId:', roomId);

        if (!socket) {
            console.error('❌ No socket connection');
            return;
        }

        if (!roomId) {
            console.error('❌ No roomId set');
            return;
        }

        const userId = localStorage.getItem('userId');
        console.log('🚀 Emitting ACCEPT_MATCH:', { userId, roomId });
        socket.emit('ACCEPT_MATCH', { userId, roomId });
    };

    const handleReroll = () => {
        if (socket) {
            const userId = localStorage.getItem('userId');
            socket.emit('REROLL', userId);
        }
        reset();
        setConsoleMode('IDLE');
        setMatchPartner(null);
        setRole(null);
    };

    const handleCancelSearch = () => {
        const userId = localStorage.getItem('userId');
        if (socket && userId) {
            socket.emit('match:cancel', userId);
        }
        reset();
        setConsoleMode('IDLE');
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-pixel-purple/20 to-retro-white p-4 md:p-8">
            {/* Countdown Overlay */}
            <AnimatePresence>
                {consoleMode === 'NAVIGATING' && countdown !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-center"
                        >
                            <PartyPopper className="w-32 h-32 mx-auto text-pixel-yellow mb-6" />
                            <h2 className="font-pixel text-5xl text-white mb-4">MATCH CONFIRMED!</h2>
                            <p className="text-white/80 text-xl mb-8">Entering video room...</p>
                            <motion.div
                                className="w-24 h-24 mx-auto rounded-full border-8 border-pixel-yellow flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <span className="font-pixel text-6xl text-white">{countdown}</span>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Back Button */}
            <div className="max-w-4xl mx-auto mb-6">
                <Link
                    href="/match"
                    className="inline-flex items-center gap-2 text-cocoa-light hover:text-cocoa font-bold transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Match</span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="font-pixel text-4xl text-cocoa uppercase tracking-wider mb-2">
                        AI MATCHMAKER
                    </h1>
                    <p className="text-cocoa-light font-bold">
                        Powered by RAG Agent • Real-time Queue System
                    </p>
                </motion.div>

                {/* Console States */}
                <AnimatePresence mode="wait">
                    {/* IDLE - Prompt Deck */}
                    {consoleMode === 'IDLE' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PromptDeck onSubmit={handleSubmitQuery} isLoading={loading} />
                        </motion.div>
                    )}

                    {/* PROCESSING - Terminal */}
                    {consoleMode === 'PROCESSING' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <AgentTerminal
                                logs={steps}
                                isActive={loading}
                                onComplete={() => { }}
                            />

                            {error && (
                                <motion.div className="mt-4 bg-pixel-red/20 border-2 border-pixel-red rounded-lg p-4 text-center">
                                    <p className="text-cocoa font-bold">{error}</p>
                                    <button
                                        onClick={handleReroll}
                                        className="mt-2 px-4 py-2 bg-retro-white border-2 border-cocoa rounded-lg font-pixel text-sm hover:bg-pixel-yellow transition-all"
                                    >
                                        TRY AGAIN
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* WAITING - Queue Status */}
                    {consoleMode === 'WAITING' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <WaitingState
                                queuePosition={queuePosition}
                                totalInQueue={totalInQueue}
                                onCancel={handleCancelSearch}
                            />

                            {/* Live position indicator */}
                            <motion.div
                                key={queuePosition}
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="mt-4 text-center text-cocoa-light text-sm"
                            >
                                <p>Estimated wait: {estimatedWait}</p>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* REVIEWING - Match Proposed */}
                    {consoleMode === 'REVIEWING' && matchPartner && (
                        <motion.div
                            key="reviewing"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="bg-retro-white border-4 border-pixel-yellow rounded-2xl p-8 shadow-2xl">
                                <div className="text-center mb-6">
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: 2 }}
                                    >
                                        <PartyPopper className="w-16 h-16 mx-auto text-pixel-yellow mb-2" />
                                    </motion.div>
                                    <h2 className="font-pixel text-3xl text-cocoa mb-2">
                                        {role === 'INITIATOR' ? 'MATCH FOUND!' : 'SOMEONE MATCHED YOU!'}
                                    </h2>
                                    <p className="text-cocoa-light font-bold">
                                        {role === 'RECEIVER' && "You were matched while waiting 🎉"}
                                    </p>
                                </div>

                                <div className="bg-pixel-blue/10 border-2 border-pixel-blue rounded-lg p-6 mb-6">
                                    <h3 className="font-pixel text-lg text-cocoa mb-2">Partner</h3>
                                    <p className="text-cocoa font-bold mb-1">{matchPartner.display_name}</p>
                                    {matchPartner.query && (
                                        <p className="text-cocoa-light text-sm italic">"{matchPartner.query}"</p>
                                    )}

                                    <div className="mt-4 p-3 bg-white rounded-lg">
                                        <p className="text-xs text-cocoa-light uppercase mb-1">AI Analysis</p>
                                        <p className="text-cocoa text-sm">{reasoning}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAcceptMatch}
                                        className="flex-1 bg-pixel-green border-3 border-cocoa rounded-lg px-6 py-4 font-pixel text-cocoa uppercase hover:scale-105 transition-transform shadow-pixel"
                                    >
                                        ✨ CONNECT
                                    </button>
                                    <button
                                        onClick={handleReroll}
                                        className="bg-retro-white border-3 border-cocoa rounded-lg px-6 py-4 font-pixel text-sm text-cocoa uppercase hover:bg-pixel-red/20 transition-all"
                                    >
                                        REROLL
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-cocoa/10 border border-cocoa rounded-lg text-xs font-mono">
                        <div>Mode: {consoleMode}</div>
                        <div>Role: {role || 'None'}</div>
                        <div>Socket: {socket?.connected ? '✅ Connected' : '❌ Disconnected'}</div>
                        <div>Queue: {queuePosition}/{totalInQueue} ({estimatedWait})</div>
                        <div>Room: {roomId || 'None'}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
