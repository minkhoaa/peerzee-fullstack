'use client';

import React, { useRef, useEffect } from 'react';
import { Phone, Video, MoreHorizontal, Search, X, Reply, Smile, MoreVertical, Snowflake } from 'lucide-react';
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
 * ChatWindow - Main chat area with header and message stream
 * Notion-style design with distinct message bubbles
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

    // Get bubble radius based on position in group
    const getBubbleRadius = (m: Message, index: number) => {
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        const isFirstInGroup = !prevMessage || prevMessage.sender_id !== m.sender_id || prevMessage.isDeleted;
        const isLastInGroup = !nextMessage || nextMessage.sender_id !== m.sender_id || nextMessage.isDeleted;

        if (m.sender_id === userId) {
            // My messages - right aligned, rounded-tr-sm
            if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-tr-sm';
            if (isFirstInGroup) return 'rounded-2xl rounded-tr-sm rounded-br-lg';
            if (isLastInGroup) return 'rounded-2xl rounded-tr-lg rounded-br-sm';
            return 'rounded-2xl rounded-r-lg';
        } else {
            // Their messages - left aligned, rounded-tl-sm
            if (isFirstInGroup && isLastInGroup) return 'rounded-2xl rounded-tl-sm';
            if (isFirstInGroup) return 'rounded-2xl rounded-tl-sm rounded-bl-lg';
            if (isLastInGroup) return 'rounded-2xl rounded-tl-lg rounded-bl-sm';
            return 'rounded-2xl rounded-l-lg';
        }
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
                    <span className="w-1.5 h-1.5 bg-[#9B9A97] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#9B9A97] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#9B9A97] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-[#9B9A97]">
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
                <div className="bg-[#202020] border border-[#2F2F2F] rounded-xl p-6 max-w-sm text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                        <Snowflake className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-medium mb-2">Break the ice! 🧊</h3>
                    <p className="text-[#9B9A97] text-sm mb-4">
                        Start a conversation with {conversation.name || 'this person'}
                    </p>
                    {isAiGenerated && (
                        <div className="flex items-center justify-center gap-1 text-[10px] text-cyan-400 mb-2">
                            <span>✨</span>
                            <span>AI-generated for you</span>
                        </div>
                    )}
                    <div className="bg-[#191919] border border-[#2F2F2F] rounded-lg p-3 mb-4">
                        <p className="text-[#E3E3E3] text-sm italic">
                            "{icebreakerText}"
                        </p>
                    </div>
                    <button
                        className="w-full py-2.5 bg-[#2383E2] hover:bg-[#1a6bc2] text-white text-sm font-medium rounded-lg transition-colors"
                        onClick={() => {
                            onSendIcebreaker(icebreakerText);
                        }}
                    >
                        Gửi câu này ngay
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-[#191919]">
            {/* Header */}
            <div className="h-16 border-b border-[#2F2F2F] flex items-center px-4 justify-between bg-[#191919] shrink-0">
                {/* Left - User Info */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#505050] to-[#404040] flex items-center justify-center text-white font-semibold text-sm">
                            {conversation.name?.slice(0, 1)?.toUpperCase() || '?'}
                        </div>
                        {/* Status dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#191919] ${isOnline ? 'bg-green-500' : 'bg-[#505050]'}`} />
                    </div>
                    <div>
                        <h2 className="text-white font-medium text-sm">{conversation.name || 'Unknown'}</h2>
                        <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-[#9B9A97]'}`}>
                            {isOnline ? 'Online' : 'Offline'}
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
                                className="px-3 py-1.5 text-sm bg-[#202020] border border-[#2F2F2F] rounded-lg text-[#E3E3E3] placeholder-[#9B9A97] focus:outline-none focus:ring-1 focus:ring-[#2383E2] w-48"
                                autoFocus
                            />
                            <button onClick={() => { setShowSearchBar(false); setSearchQuery(''); }} className="p-1.5 text-[#9B9A97] hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowSearchBar(true)} className="p-2 text-[#9B9A97] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    )}

                    {/* Call buttons */}
                    {callState === 'idle' ? (
                        <>
                            <button
                                onClick={onStartAudioCall}
                                className="p-2 text-[#9B9A97] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                                title="Audio Call"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onStartVideoCall}
                                className="p-2 text-[#9B9A97] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Video Call"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onEndCall}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors animate-pulse"
                            title="End Call"
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                    )}

                    <button className="p-2 text-[#9B9A97] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            {messages.length === 0 ? (
                <IcebreakerWidget />
            ) : (
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {messages.map((m, index) => (
                        <div
                            key={m.id}
                            id={`message-${m.id}`}
                            className={`flex ${getMessageSpacing(index)} ${m.sender_id === userId ? 'justify-end' : 'justify-start'} ${highlightedMessageId === m.id ? 'animate-pulse bg-yellow-500/10 -mx-2 px-2 rounded-lg' : ''}`}
                        >
                            {/* Deleted Message */}
                            {m.isDeleted ? (
                                <div className="flex items-center justify-center w-full">
                                    <span className="text-sm text-[#9B9A97] italic">Message deleted</span>
                                </div>
                            ) : editingMessageId === m.id ? (
                                /* Editing State */
                                <div className="flex flex-col gap-2 max-w-[70%]">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-[#202020] border border-[#2F2F2F] rounded-lg text-[#E3E3E3] focus:outline-none focus:ring-1 focus:ring-[#2383E2] resize-none"
                                        rows={2}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => { setEditingMessageId(null); setEditContent(''); }} className="px-3 py-1.5 text-xs text-[#9B9A97] hover:text-white transition-colors">
                                            Cancel
                                        </button>
                                        <button onClick={handleEditSubmit} className="px-3 py-1.5 text-xs bg-[#2383E2] text-white rounded-md hover:bg-[#1a6bc2] transition-colors">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Message */
                                <div className="flex flex-col max-w-[70%]">
                                    {/* Sender name - show above first message in group for other users */}
                                    {m.sender_id !== userId && isFirstInMessageGroup(index) && (
                                        <span className="text-xs text-[#9B9A97] mb-1 ml-9">
                                            {getSenderName(m.sender_id)}
                                        </span>
                                    )}

                                    <div className={`group flex items-end gap-2 ${m.sender_id === userId ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar - only for other users */}
                                        {m.sender_id !== userId && (
                                            <div className="shrink-0 mb-0.5">
                                                {shouldShowAvatar(index) ? (
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#505050] to-[#404040] flex items-center justify-center text-white text-xs font-medium">
                                                        {getSenderName(m.sender_id).slice(0, 1).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7" />
                                                )}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`relative ${getBubbleRadius(m, index)} ${m.sender_id === userId
                                            ? 'bg-[#2383E2] text-white'
                                            : 'bg-transparent border border-[#2F2F2F] text-[#E3E3E3]'
                                            } transition-all duration-200`}>

                                            {/* Quoted Reply */}
                                            {m.replyTo && (
                                                <div className={`mx-2 mt-2 px-3 py-2 rounded-lg text-xs border-l-2 ${m.sender_id === userId
                                                    ? 'bg-[#1a6bc2] border-white/30'
                                                    : 'bg-[#202020] border-[#2F2F2F]'
                                                    }`}>
                                                    <p className="font-medium mb-0.5 opacity-70">
                                                        {m.replyTo.sender_id === userId ? 'You' : getSenderName(m.replyTo.sender_id)}
                                                    </p>
                                                    <p className="truncate opacity-80">
                                                        {m.replyTo.body?.slice(0, 50)}{m.replyTo.body && m.replyTo.body.length > 50 ? '...' : ''}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Image attachment */}
                                            {m.fileUrl && m.fileType?.startsWith('image/') && (
                                                <img
                                                    src={m.fileUrl}
                                                    alt={m.fileName || 'Image'}
                                                    className="w-full rounded-t-2xl object-cover max-h-64"
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
                                                <p className="px-4 py-2.5 text-sm break-words whitespace-pre-wrap">{m.body}</p>
                                            )}

                                            {/* Timestamp tooltip */}
                                            <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-[#9B9A97] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${m.sender_id === userId ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                                {formatMessageTime(m.createdAt)}
                                            </span>

                                            {/* Edited indicator */}
                                            {m.isEdited && (
                                                <span className={`absolute -bottom-4 text-[10px] text-[#9B9A97] ${m.sender_id === userId ? 'right-0' : 'left-0'}`}>edited</span>
                                            )}

                                            {/* Reactions */}
                                            {m.reactions && m.reactions.length > 0 && (
                                                <div className={`absolute -bottom-3 flex gap-0.5 ${m.sender_id === userId ? 'right-2' : 'left-2'}`}>
                                                    {[...new Set(m.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, i) => (
                                                        <span key={i} className="text-xs bg-[#202020] border border-[#2F2F2F] rounded-full px-1 shadow-sm">{emoji}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Read status */}
                                            {m.sender_id === userId && index === messages.length - 1 && (
                                                <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                                                    <span className={m.readAt ? 'text-[#2383E2]' : 'text-[#9B9A97]'}>
                                                        {m.readAt ? Icons.doubleCheck : Icons.singleCheck}
                                                    </span>
                                                    {m.readAt && (
                                                        <span className="text-[10px] text-[#2383E2]">Seen</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onReply(m)}
                                                className="p-1.5 text-[#9B9A97] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors"
                                                title="Reply"
                                            >
                                                <Reply className="w-4 h-4" />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenEmojiPickerId(openEmojiPickerId === m.id ? null : m.id); }}
                                                    className="p-1.5 text-[#9B9A97] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                {openEmojiPickerId === m.id && (
                                                    <div className={`absolute bottom-full mb-1 z-50 bg-[#202020] border border-[#2F2F2F] rounded-lg shadow-lg p-1.5 flex gap-0.5 ${m.sender_id === userId ? 'right-0' : 'left-0'}`}>
                                                        {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => { onReaction(m.id, emoji); setOpenEmojiPickerId(null); }}
                                                                className="text-sm hover:bg-[#2F2F2F] rounded p-1.5 hover:scale-110 transition-transform"
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
                                                        className="p-1.5 text-[#9B9A97] hover:text-white hover:bg-[#2F2F2F] rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === m.id && (
                                                        <div className="absolute top-full mt-1 right-0 z-50 bg-[#202020] border border-[#2F2F2F] rounded-lg shadow-lg overflow-hidden min-w-[100px]">
                                                            <button
                                                                onClick={() => { setEditingMessageId(m.id); setEditContent(m.body); setOpenMenuId(null); }}
                                                                className="w-full px-3 py-2 text-xs text-left text-[#E3E3E3] hover:bg-[#2F2F2F] transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { onDeleteMessage(m); setOpenMenuId(null); }}
                                                                className="w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 transition-colors"
                                                            >
                                                                Delete
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
