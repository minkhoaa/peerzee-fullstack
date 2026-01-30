'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface AgentTerminalProps {
    logs: string[];
    isActive?: boolean;
    onComplete?: () => void;
}

/**
 * AgentTerminal - CRT-style terminal for displaying RAG workflow logs
 * Features: Typewriter effect, auto-scroll, blinking cursor, ASCII progress
 */
export function AgentTerminal({ logs, isActive = true, onComplete }: AgentTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);

    // Auto-scroll to bottom when new logs appear
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [displayedLogs]);

    // Typewriter effect for streaming logs
    useEffect(() => {
        if (currentLogIndex >= logs.length) {
            if (onComplete) onComplete();
            return;
        }

        const currentLog = logs[currentLogIndex];

        if (currentCharIndex < currentLog.length) {
            const timer = setTimeout(() => {
                setDisplayedLogs(prev => {
                    const newLogs = [...prev];
                    if (newLogs[currentLogIndex]) {
                        newLogs[currentLogIndex] = currentLog.substring(0, currentCharIndex + 1);
                    } else {
                        newLogs.push(currentLog.substring(0, currentCharIndex + 1));
                    }
                    return newLogs;
                });
                setCurrentCharIndex(prev => prev + 1);
            }, 20); // 20ms per character for smooth streaming

            return () => clearTimeout(timer);
        } else {
            // Move to next log
            const timer = setTimeout(() => {
                setCurrentLogIndex(prev => prev + 1);
                setCurrentCharIndex(0);
            }, 300); // Brief pause between logs

            return () => clearTimeout(timer);
        }
    }, [logs, currentLogIndex, currentCharIndex, onComplete]);

    // Parse log for color coding
    const parseLogColor = (log: string) => {
        if (log.includes('[SYSTEM]')) return 'text-pixel-yellow';
        if (log.includes('[PARSER]')) return 'text-pixel-blue';
        if (log.includes('[VECTOR]')) return 'text-pixel-purple';
        if (log.includes('[RAG]')) return 'text-pixel-orange';
        if (log.includes('[AGENT]')) return 'text-pixel-pink';
        if (log.includes('[SUCCESS]')) return 'text-pixel-green';
        if (log.includes('[ERROR]')) return 'text-pixel-red';
        return 'text-parchment/80';
    };

    return (
        <div className="bg-[#1A1A1A] border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-cocoa/20 border-b-2 border-cocoa/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-pixel-green" />
                    <span className="font-pixel text-xs text-pixel-green uppercase tracking-wider">
                        RAG MATCHMAKER CONSOLE
                    </span>
                </div>
                <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-pixel-red border border-cocoa" />
                    <div className="w-2.5 h-2.5 rounded-full bg-pixel-yellow border border-cocoa" />
                    <div className="w-2.5 h-2.5 rounded-full bg-pixel-green border border-cocoa" />
                </div>
            </div>

            {/* Terminal Body */}
            <div
                ref={terminalRef}
                className="p-4 h-[400px] overflow-y-auto font-mono text-sm crt-flicker"
            >
                <AnimatePresence mode="popLayout">
                    {displayedLogs.map((log, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`mb-1 ${parseLogColor(log)}`}
                        >
                            <span className="text-cocoa/50 mr-2">{'>'}</span>
                            {log}
                            {index === displayedLogs.length - 1 && currentCharIndex < logs[currentLogIndex]?.length && (
                                <span className="inline-block w-2 h-4 bg-pixel-green ml-1 animate-blink" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Blinking cursor at the end */}
                {isActive && currentLogIndex >= logs.length && (
                    <div className="flex items-center gap-1 text-pixel-green">
                        <span>{'>'}</span>
                        <span className="inline-block w-2 h-4 bg-pixel-green animate-blink" />
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes blink {
                    0%, 49% { opacity: 1; }
                    50%, 100% { opacity: 0; }
                }
                
                @keyframes flicker {
                    0% { opacity: 0.98; }
                    50% { opacity: 1; }
                    100% { opacity: 0.98; }
                }
                
                .animate-blink {
                    animation: blink 1s infinite;
                }
                
                .crt-flicker {
                    animation: flicker 0.15s infinite;
                }
            `}</style>
        </div>
    );
}
