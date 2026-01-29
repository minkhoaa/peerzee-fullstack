'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Swords } from 'lucide-react';

interface RPGChatBubbleProps {
    message: string;
    isOwn: boolean;
    senderName?: string;
    senderAvatar?: string;
    timestamp?: string;
    isEdited?: boolean;
    isDeleted?: boolean;
    showAvatar?: boolean;
    showName?: boolean;
    reactions?: { emoji: string; count: number }[];
    isRead?: boolean;
    replyTo?: { senderName: string; body: string } | null;
    imageUrl?: string;
    children?: React.ReactNode;
}

/**
 * RPGChatBubble - Pixel RPG styled message bubble
 * Features: pixel-border, ::after tail pseudo-element, retro aesthetic
 */
export default function RPGChatBubble({
    message,
    isOwn,
    senderName,
    senderAvatar,
    timestamp,
    isEdited,
    isDeleted,
    showAvatar = true,
    showName = true,
    reactions,
    isRead,
    replyTo,
    imageUrl,
    children,
}: RPGChatBubbleProps) {
    // Deleted message state
    if (isDeleted) {
        return (
            <div className="flex items-center justify-center py-2">
                <span className="text-sm text-cocoa-light italic font-pixel flex items-center gap-1">
                    <Swords className="w-4 h-4" strokeWidth={2.5} /> Message deleted
                </span>
            </div>
        );
    }

    return (
        <div className={clsx(
            'flex gap-3 animate-bounce-in',
            isOwn ? 'flex-row-reverse' : 'flex-row'
        )}>
            {/* Avatar */}
            {showAvatar && !isOwn && (
                <div className="shrink-0">
                    {senderAvatar ? (
                        <img
                            src={senderAvatar}
                            alt={senderName || 'User'}
                            className="w-10 h-10 border-2 border-cocoa object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 bg-pixel-yellow border-2 border-cocoa flex items-center justify-center font-pixel font-bold text-cocoa">
                            {senderName?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                </div>
            )}

            <div className={clsx(
                'flex flex-col max-w-[70%]',
                isOwn ? 'items-end' : 'items-start'
            )}>
                {/* Sender name */}
                {showName && senderName && !isOwn && (
                    <span className="text-xs text-cocoa-light font-pixel font-medium mb-1 ml-2">
                        {senderName}
                    </span>
                )}

                {/* Message bubble */}
                <div className={clsx(
                    'relative px-4 py-3 font-pixel text-sm',
                    'border-2 border-cocoa',
                    isOwn
                        ? 'bg-pixel-pink text-cocoa pixel-speech-right'
                        : 'bg-retro-white text-cocoa pixel-speech-left',
                    'shadow-pixel-sm'
                )}>
                    {/* Reply quote */}
                    {replyTo && (
                        <div className={clsx(
                            'mb-2 px-3 py-2 text-xs border-l-2',
                            isOwn
                                ? 'bg-pixel-pink/20 border-pixel-pink'
                                : 'bg-pixel-yellow/50 border-cocoa'
                        )}>
                            <p className="font-semibold opacity-80">{replyTo.senderName}</p>
                            <p className="truncate opacity-70">{replyTo.body}</p>
                        </div>
                    )}

                    {/* Image attachment */}
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt="Attachment"
                            className="w-full max-h-64 object-cover border-2 border-cocoa mb-2"
                        />
                    )}

                    {/* Message text */}
                    <p className="break-words whitespace-pre-wrap">{message}</p>

                    {/* Custom children (audio, etc.) */}
                    {children}

                    {/* Edited indicator */}
                    {isEdited && (
                        <span className="text-[10px] text-cocoa/50 ml-2">(edited)</span>
                    )}
                </div>

                {/* Timestamp & read status */}
                <div className={clsx(
                    'flex items-center gap-1 mt-1 px-2',
                    isOwn ? 'flex-row-reverse' : 'flex-row'
                )}>
                    {timestamp && (
                        <span className="text-[10px] text-cocoa/50 font-pixel">
                            {timestamp}
                        </span>
                    )}
                    {isOwn && (
                        <span className={clsx(
                            'text-[10px] font-pixel',
                            isRead ? 'text-pixel-pink' : 'text-cocoa/40'
                        )}>
                            {isRead ? '✓✓' : '✓'}
                        </span>
                    )}
                </div>

                {/* Reactions */}
                {reactions && reactions.length > 0 && (
                    <div className={clsx(
                        'flex gap-1 mt-1',
                        isOwn ? 'justify-end' : 'justify-start'
                    )}>
                        {reactions.map((reaction, i) => (
                            <span
                                key={i}
                                className="text-xs bg-retro-white border border-cocoa px-1.5 py-0.5 shadow-pixel-sm"
                            >
                                {reaction.emoji} {reaction.count > 1 && reaction.count}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
