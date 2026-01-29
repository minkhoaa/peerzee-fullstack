'use client';

import React, { useRef, useEffect } from 'react';
import { Phone, Video, MoreHorizontal, Search, X, Reply, Smile, MoreVertical, Wand2, Pencil, Trash2, Snowflake } from 'lucide-react';
import AudioMessage from './AudioMessage';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    seq: string;
    createdAt: string;
    updatedAt: string;
    isEdited?: boolean;
    isDeleted?: boolean;
    reactions?: { emoji: string; user_id: string }[];
    readAt?: string | null;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    reply_to_id?: string | null;
    replyTo?: { id: string; body: string; sender_id: string } | null;
}

interface Conversation {
    id: string;
    type: string;
    lastMessageAt: string | null;
    lastSeq: string;
    name?: string;
    lastMessage?: string;
    participantIds?: string[];
    icebreakerSuggestion?: string; // AI-generated icebreaker
}

interface ChatWindowProps {
    conversation: Conversation;
    messages: Message[];
    userId: string | null;
    isOnline: boolean;
    userNames: Record<string, string>;
    typingUsers: string[];
    highlightedMessageId: string | null;
    onStartAudioCall: () => void;
    onStartVideoCall: () => void;
    onEndCall: () => void;
    onEditMessage: (messageId: string, content: string) => void;
    onDeleteMessage: (message: Message) => void;
    onReaction: (messageId: string, emoji: string) => void;
    onReply: (message: Message) => void;
    onSearchMessage: (query: string) => void;
    callState: string;
    onSendIcebreaker: (question: string) => void;
}

// Icons for message status
const Icons = {
    doubleCheck: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 13l4 4L15 7" />
        </svg>
    ),
    singleCheck: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
};

/**
 * ChatWindow - Retro Pixel OS Style with 8-bit Bubbles
 * Pixel borders, warm cocoa colors, fun aesthetic
 */
export default function ChatWindow({
    conversation,
    messages,
    userId,
    isOnline,
    userNames,
    typingUsers,
    highlightedMessageId,
    onStartAudioCall,
    onStartVideoCall,
    onEndCall,
    onEditMessage,
    onDeleteMessage,
    onReaction,
    onReply,
    onSearchMessage,
    callState,
    onSendIcebreaker,
}: ChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showSearchBar, setShowSearchBar] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
    const [editContent, setEditContent] = React.useState('');
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
    const [openEmojiPickerId, setOpenEmojiPickerId] = React.useState<string | null>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close menus on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            if (openEmojiPickerId) setOpenEmojiPickerId(null);
            if (openMenuId) setOpenMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openEmojiPickerId, openMenuId]);

    // Format message timestamp
    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        if (diffDays === 0) {
            return timeStr;
        } else if (diffDays === 1) {
            return `Yesterday ${timeStr}`;
        } else if (diffDays < 7) {
            return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${timeStr}`;
        } else {
            return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${timeStr}`;
        }
    };

    // Get sender name
    const getSenderName = (senderId: string) => {
        return userNames[senderId] || senderId.slice(0, 8);
    };

    // Check if first in message group
    const isFirstInMessageGroup = (index: number) => {
        const currentMessage = messages[index];
        const prevMessage = messages[index - 1];
        return !prevMessage || prevMessage.sender_id !== currentMessage.sender_id || prevMessage.isDeleted;
    };

    // Check if should show avatar
    const shouldShowAvatar = (index: number) => {
        const currentMessage = messages[index];
        const nextMessage = messages[index + 1];
        return !nextMessage || nextMessage.sender_id !== currentMessage.sender_id || nextMessage.isDeleted;
    };

    // Get message spacing
    const getMessageSpacing = (index: number) => {
        const prevMessage = messages[index - 1];
        const currentMessage = messages[index];
        if (!prevMessage) return 'mt-0';
        return prevMessage.sender_id !== currentMessage.sender_id || prevMessage.isDeleted ? 'mt-4' : 'mt-1';
    };

    // Get bubble radius based on position in group - Pixel style
    const getBubbleRadius = (m: Message, index: number) => {
        return 'rounded-lg'; // Simple pixel-style radius
    };

    const handleEditSubmit = () => {
        if (editingMessageId && editContent.trim()) {
            onEditMessage(editingMessageId, editContent.trim());
            setEditingMessageId(null);
            setEditContent('');
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            onSearchMessage(searchQuery.trim());
        }
    };

    // Typing indicator component
    const TypingIndicator = () => {
        if (typingUsers.length === 0) return null;
        return (
            <div className="px-5 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-pixel-pink border border-cocoa rounded-sm animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-cocoa-light font-bold">
                    {typingUsers.length === 1
                        ? `${userNames[typingUsers[0]] || 'Someone'} is typing`
                        : `${typingUsers.length} people typing`}
                </span>
            </div>
        );
    };

    // Icebreaker widget when no messages
    const IcebreakerWidget = () => {
        if (messages.length > 0) return null;

        // Use AI-generated icebreaker if available, otherwise fallback
        const icebreakerText = conversation.icebreakerSuggestion ||
            "Hey! I noticed we matched. What got you interested in tech?";
        const isAiGenerated = !!conversation.icebreakerSuggestion;

        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-retro-paper border-3 border-cocoa rounded-xl shadow-pixel p-8 max-w-sm text-center">
                    <div className="w-20 h-20 border-3 border-cocoa rounded-xl bg-pixel-purple flex items-center justify-center mx-auto mb-5 shadow-pixel-sm">
                        <Wand2 className="w-10 h-10 text-cocoa" />
                    </div>
                    <h3 className="font-pixel text-cocoa text-xl uppercase tracking-widest mb-3">🧊 Break the Ice!</h3>
                    <p className="text-cocoa-light text-sm mb-4 font-bold">
                        Start a conversation with {conversation.name || 'this person'}
                    </p>
                    {isAiGenerated && (
                        <div className="flex items-center justify-center gap-1 text-xs text-pixel-purple font-pixel uppercase tracking-wider mb-2">
                            <span>AI-Generated</span>
                        </div>
                    )}
                    <div className="bg-retro-white border-2 border-cocoa rounded-lg p-4 mb-5 shadow-pixel-inset">
                        <p className="text-cocoa text-sm italic font-bold">
                            "{icebreakerText}"
                        </p>
                    </div>
                    <button
                        className="w-full py-3 bg-pixel-pink border-3 border-cocoa hover:bg-pixel-pink-dark text-cocoa font-pixel uppercase tracking-widest rounded-lg shadow-pixel transition-all active:translate-y-0.5 active:shadow-none"
                        onClick={() => {
                            onSendIcebreaker(icebreakerText);
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
            {/* Header - Retro Pixel style */}
            <div className="h-18 border-b-3 border-cocoa bg-retro-paper flex items-center px-4 justify-between shrink-0 sticky top-0 z-10">
                {/* Left - User Info */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-12 h-12 border-2 border-cocoa rounded-lg bg-pixel-pink flex items-center justify-center text-cocoa font-pixel text-base shadow-pixel-sm">
                            {conversation.name?.slice(0, 1)?.toUpperCase() || '?'}
                        </div>
                        {/* Status dot */}
                        {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pixel-green border-2 border-cocoa rounded" />
                        )}
                    </div>
                    <div>
                        <h2 className="font-pixel text-cocoa text-base uppercase tracking-widest">{conversation.name || 'Unknown'}</h2>
                        <p className={`text-xs font-bold ${isOnline ? 'text-pixel-green' : 'text-cocoa-light'}`}>
                            {isOnline ? '● ONLINE' : '○ OFFLINE'}
                        </p>
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-1">
                    {/* Search */}
                    {showSearchBar ? (
                        <div className="flex items-center gap-2 mr-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                placeholder="Search messages..."
                                className="px-4 py-2 text-sm bg-retro-white border-2 border-cocoa rounded-lg text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-pink shadow-pixel-inset w-48 font-bold"
                                autoFocus
                            />
                            <button onClick={() => { setShowSearchBar(false); setSearchQuery(''); }} className="p-2 text-cocoa hover:bg-pixel-red hover:text-white border-2 border-transparent hover:border-cocoa rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowSearchBar(true)} className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue border-2 border-transparent hover:border-cocoa rounded-lg transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    )}

                    {/* Call buttons */}
                    {callState === 'idle' ? (
                        <>
                            <button
                                onClick={onStartAudioCall}
                                className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-green border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                                title="Audio Call"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onStartVideoCall}
                                className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-pink border-2 border-transparent hover:border-cocoa rounded-lg transition-colors"
                                title="Video Call"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onEndCall}
                            className="p-2 text-white bg-pixel-red border-2 border-cocoa rounded-lg transition-colors animate-pulse shadow-pixel-sm"
                            title="End Call"
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                    )}

                    <button className="p-2 text-cocoa-light hover:text-cocoa hover:bg-retro-bg border-2 border-transparent hover:border-cocoa rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            {messages.length === 0 ? (
                <IcebreakerWidget />
            ) : (
                <div className="flex-1 overflow-y-auto p-4 bg-retro-bg">
                    {messages.map((m, index) => (
                        <div
                            key={m.id}
                            id={`message-${m.id}`}
                            className={`flex ${getMessageSpacing(index)} ${m.sender_id === userId ? 'justify-end' : 'justify-start'} ${highlightedMessageId === m.id ? 'animate-pulse bg-pixel-yellow/30 -mx-2 px-2 rounded-lg border-2 border-pixel-yellow' : ''}`}
                        >
                            {/* Deleted Message */}
                            {m.isDeleted ? (
                                <div className="flex items-center justify-center w-full">
                                    <span className="text-sm text-cocoa-light italic font-bold flex items-center gap-1"><Trash2 className="w-4 h-4" strokeWidth={2.5} /> Message deleted</span>
                                </div>
                            ) : editingMessageId === m.id ? (
                                /* Editing State */
                                <div className="flex flex-col gap-2 max-w-[70%]">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-4 py-3 text-sm bg-retro-white border-3 border-cocoa rounded-lg text-cocoa focus:outline-none focus:ring-2 focus:ring-pixel-pink resize-none shadow-pixel-inset font-bold"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => { setEditingMessageId(null); setEditContent(''); }} className="px-4 py-2 text-xs font-pixel uppercase tracking-wider text-cocoa-light hover:text-cocoa transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={handleEditSubmit} className="px-4 py-2 text-xs bg-pixel-green border-2 border-cocoa text-cocoa font-pixel uppercase tracking-wider rounded-lg hover:bg-green-400 shadow-pixel-sm transition-colors active:translate-y-0.5 active:shadow-none">
                                            Save ✓
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Message */
                                <div className="flex flex-col max-w-[70%]">
                                    {/* Sender name - show above first message in group for other users */}
                                    {m.sender_id !== userId && isFirstInMessageGroup(index) && (
                                        <span className="text-xs text-cocoa-light font-bold mb-1 ml-11">
                                            {getSenderName(m.sender_id)}
                                        </span>
                                    )}

                                    <div className={`group flex items-end gap-2 ${m.sender_id === userId ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar - only for other users */}
                                        {m.sender_id !== userId && (
                                            <div className="shrink-0 mb-0.5">
                                                {shouldShowAvatar(index) ? (
                                                    <div className="w-9 h-9 border-2 border-cocoa rounded-lg bg-pixel-purple flex items-center justify-center text-cocoa text-xs font-pixel shadow-pixel-sm">
                                                        {getSenderName(m.sender_id).slice(0, 1).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-9 h-9" />
                                                )}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`relative ${getBubbleRadius(m, index)} border-2 border-cocoa ${m.sender_id === userId
                                            ? 'bg-pixel-pink text-cocoa shadow-pixel-sm'
                                            : 'bg-retro-white text-cocoa shadow-pixel-sm'
                                            } transition-all duration-200`}>

                                            {/* Quoted Reply */}
                                            {m.replyTo && (
                                                <div className={`mx-2 mt-2 px-3 py-2 rounded-md text-xs border-l-3 ${m.sender_id === userId
                                                    ? 'bg-pixel-pink-dark border-cocoa'
                                                    : 'bg-retro-bg border-cocoa'
                                                    }`}>
                                                    <p className="font-pixel uppercase tracking-wider text-[10px] mb-0.5 opacity-80">
                                                        {m.replyTo.sender_id === userId ? 'You' : getSenderName(m.replyTo.sender_id)}
                                                    </p>
                                                    <p className="truncate opacity-80 font-bold">
                                                        {m.replyTo.body?.slice(0, 50)}{m.replyTo.body && m.replyTo.body.length > 50 ? '...' : ''}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Image attachment */}
                                            {m.fileUrl && m.fileType?.startsWith('image/') && (
                                                <img
                                                    src={m.fileUrl}
                                                    alt={m.fileName || 'Image'}
                                                    className="w-full rounded-t-md object-cover max-h-64 border-b-2 border-cocoa"
                                                />
                                            )}

                                            {/* Audio Message */}
                                            {m.fileUrl && (m.fileType?.startsWith('audio/') || m.fileName?.includes('voice') || m.body?.startsWith('🎤 Voice message')) && (
                                                <div className="px-2 py-2">
                                                    <AudioMessage
                                                        audioUrl={m.fileUrl}
                                                        isOwn={m.sender_id === userId}
                                                    />
                                                </div>
                                            )}

                                            {/* Text body */}
                                            {m.body && !(m.fileUrl && m.body.startsWith('🎤 Voice message')) && (
                                                <p className="px-4 py-2.5 text-sm break-words whitespace-pre-wrap font-bold">{m.body}</p>
                                            )}

                                            {/* Timestamp tooltip */}
                                            <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-cocoa-light font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${m.sender_id === userId ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                                {formatMessageTime(m.createdAt)}
                                            </span>

                                            {/* Edited indicator */}
                                            {m.isEdited && (
                                                <span className={`absolute -bottom-5 text-[10px] text-cocoa-light font-pixel uppercase tracking-wider ${m.sender_id === userId ? 'right-0' : 'left-0'}`}>edited</span>
                                            )}

                                            {/* Reactions */}
                                            {m.reactions && m.reactions.length > 0 && (
                                                <div className={`absolute -bottom-3 flex gap-0.5 ${m.sender_id === userId ? 'right-2' : 'left-2'}`}>
                                                    {[...new Set(m.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, i) => (
                                                        <span key={i} className="text-xs bg-retro-white border-2 border-cocoa rounded-md px-1 shadow-pixel-sm">{emoji}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Read status */}
                                            {m.sender_id === userId && index === messages.length - 1 && (
                                                <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                                                    <span className={m.readAt ? 'text-pixel-green' : 'text-cocoa-light'}>
                                                        {m.readAt ? Icons.doubleCheck : Icons.singleCheck}
                                                    </span>
                                                    {m.readAt && (
                                                        <span className="text-[10px] text-pixel-green font-bold">Seen</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onReply(m)}
                                                className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue border border-transparent hover:border-cocoa rounded-md transition-colors"
                                                title="Reply"
                                            >
                                                <Reply className="w-4 h-4" />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenEmojiPickerId(openEmojiPickerId === m.id ? null : m.id); }}
                                                    className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-yellow border border-transparent hover:border-cocoa rounded-md transition-colors"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                {openEmojiPickerId === m.id && (
                                                    <div className={`absolute bottom-full mb-1 z-50 bg-retro-white border-2 border-cocoa rounded-lg shadow-pixel p-2 flex gap-1 ${m.sender_id === userId ? 'right-0' : 'left-0'}`}>
                                                        {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => { onReaction(m.id, emoji); setOpenEmojiPickerId(null); }}
                                                                className="text-sm hover:bg-pixel-yellow rounded-md p-1.5 hover:scale-110 transition-transform border border-transparent hover:border-cocoa"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {m.sender_id === userId && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === m.id ? null : m.id); }}
                                                        className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-retro-bg border border-transparent hover:border-cocoa rounded-md transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === m.id && (
                                                        <div className="absolute top-full mt-1 right-0 z-50 bg-retro-white border-2 border-cocoa rounded-lg shadow-pixel overflow-hidden min-w-[100px]">
                                                            <button
                                                                onClick={() => { setEditingMessageId(m.id); setEditContent(m.body); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-xs text-left text-cocoa font-bold hover:bg-pixel-blue transition-colors flex items-center gap-1"
                                                            >
                                                                <Pencil className="w-3 h-3" strokeWidth={2.5} /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { onDeleteMessage(m); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-xs text-left text-pixel-red font-bold hover:bg-pixel-red/20 transition-colors flex items-center gap-1"
                                                            >
                                                                <Trash2 className="w-3 h-3" strokeWidth={2.5} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Typing Indicator */}
            <TypingIndicator />
        </div>
    );
}
