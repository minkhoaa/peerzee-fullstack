'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Phone, Video, MoreHorizontal, Search, X, Reply, Smile, MoreVertical, Wand2 } from 'lucide-react';
import { RPGHeader, RPGChatBubble, RPGButton } from '@/components/rpg';
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
    icebreakerSuggestion?: string;
    affinityScore?: number;
}

interface RPGChatWindowProps {
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

/**
 * RPGChatWindow - Pixel RPG styled chat window
 * Features: Retro pixel aesthetic, LVL/Hearts display, pixel speech bubbles
 */
export default function RPGChatWindow({
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
}: RPGChatWindowProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [openEmojiPickerId, setOpenEmojiPickerId] = useState<string | null>(null);

    // Calculate level and hearts from affinity score
    const affinityScore = conversation.affinityScore || 0;
    const level = Math.floor(affinityScore / 20) + 1;
    const hearts = Math.min(5, Math.ceil((affinityScore % 100) / 20));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (openEmojiPickerId) setOpenEmojiPickerId(null);
            if (openMenuId) setOpenMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openEmojiPickerId, openMenuId]);

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getSenderName = (senderId: string) => {
        return userNames[senderId] || senderId.slice(0, 8);
    };

    const shouldShowAvatar = (index: number) => {
        const currentMessage = messages[index];
        const nextMessage = messages[index + 1];
        return !nextMessage || nextMessage.sender_id !== currentMessage.sender_id || nextMessage.isDeleted;
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
            <div className="px-5 py-3 flex items-center gap-3 bg-rpg-blue/30 border-t-2 border-rpg-brown/20">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-rpg-brown font-display font-medium">
                    {typingUsers.length === 1
                        ? `${userNames[typingUsers[0]] || 'Someone'} is typing...`
                        : `${typingUsers.length} players typing...`}
                </span>
            </div>
        );
    };

    // Icebreaker widget
    const IcebreakerWidget = () => {
        if (messages.length > 0) return null;

        const icebreakerText = conversation.icebreakerSuggestion ||
            "Hey! I noticed we matched. What got you interested in tech?";
        const isAiGenerated = !!conversation.icebreakerSuggestion;

        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="bg-white border-4 border-rpg-brown shadow-pixel p-8 max-w-sm text-center">
                    <div className="w-16 h-16 bg-primary border-2 border-rpg-brown flex items-center justify-center mx-auto mb-5 shadow-pixel-sm">
                        <Wand2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-rpg-brown font-display font-bold text-xl mb-3">
                        ⚔️ Break the ice!
                    </h3>
                    <p className="text-rpg-brown/70 text-sm font-display mb-4">
                        Start your quest with {conversation.name || 'this player'}
                    </p>
                    {isAiGenerated && (
                        <div className="flex items-center justify-center gap-1 text-xs text-primary font-display font-bold mb-3">
                            <span>✨</span>
                            <span>AI-crafted for you</span>
                        </div>
                    )}
                    <div className="bg-rpg-blue border-2 border-rpg-brown p-4 mb-5">
                        <p className="text-rpg-brown text-sm italic font-display">
                            "{icebreakerText}"
                        </p>
                    </div>
                    <RPGButton
                        variant="primary"
                        onClick={() => onSendIcebreaker(icebreakerText)}
                        className="w-full"
                    >
                        🗡️ Send this message
                    </RPGButton>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
            {/* RPG Header */}
            <RPGHeader
                username={conversation.name || 'Unknown Player'}
                avatarFallback={conversation.name?.slice(0, 1)?.toUpperCase()}
                level={level}
                hearts={hearts}
                maxHearts={5}
                isOnline={isOnline}
                subtitle={isOnline ? '● Online' : 'Offline'}
                onAudioCall={callState === 'idle' ? onStartAudioCall : undefined}
                onVideoCall={callState === 'idle' ? onStartVideoCall : undefined}
                actions={
                    <>
                        {showSearchBar ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                    placeholder="Search messages..."
                                    className="px-3 py-1.5 text-sm bg-rpg-blue border-2 border-rpg-brown text-rpg-brown placeholder-rpg-brown/40 focus:outline-none w-40 font-display"
                                    autoFocus
                                />
                                <button onClick={() => { setShowSearchBar(false); setSearchQuery(''); }} className="p-1 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowSearchBar(true)} className="p-2 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all">
                                <Search className="w-5 h-5" />
                            </button>
                        )}
                        {callState !== 'idle' && (
                            <button
                                onClick={onEndCall}
                                className="p-2 text-red-500 bg-red-50 border-2 border-red-500 animate-pulse"
                                title="End Call"
                            >
                                <Phone className="w-5 h-5" />
                            </button>
                        )}
                    </>
                }
            />

            {/* Messages Area */}
            {messages.length === 0 ? (
                <IcebreakerWidget />
            ) : (
                <div className="flex-1 overflow-y-auto p-5 rpg-scrollbar bg-rpg-bg/50">
                    <div className="space-y-4">
                        {messages.map((m, index) => {
                            const isOwn = m.sender_id === userId;
                            const showAvatar = shouldShowAvatar(index);
                            const isHighlighted = highlightedMessageId === m.id;

                            // Group reactions by emoji
                            const groupedReactions = m.reactions?.reduce((acc, r) => {
                                const existing = acc.find(x => x.emoji === r.emoji);
                                if (existing) {
                                    existing.count++;
                                } else {
                                    acc.push({ emoji: r.emoji, count: 1 });
                                }
                                return acc;
                            }, [] as { emoji: string; count: number }[]) || [];

                            if (m.isDeleted) {
                                return (
                                    <div key={m.id} className="flex items-center justify-center py-2">
                                        <span className="text-sm text-rpg-brown/60 italic font-display">
                                            ⚔️ Message deleted
                                        </span>
                                    </div>
                                );
                            }

                            if (editingMessageId === m.id) {
                                return (
                                    <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className="flex flex-col gap-2 max-w-[70%]">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-4 py-3 text-sm bg-white border-2 border-rpg-brown text-rpg-brown focus:outline-none focus:ring-2 focus:ring-primary resize-none font-display shadow-pixel-inset"
                                                rows={2}
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <RPGButton variant="ghost" size="sm" onClick={() => { setEditingMessageId(null); setEditContent(''); }}>
                                                    Cancel
                                                </RPGButton>
                                                <RPGButton variant="primary" size="sm" onClick={handleEditSubmit}>
                                                    Save
                                                </RPGButton>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={m.id}
                                    id={`message-${m.id}`}
                                    className={`group flex ${isOwn ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'animate-pulse bg-primary-light -mx-2 px-2 py-1' : ''}`}
                                >
                                    <div className={`flex gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Avatar */}
                                        {!isOwn && (
                                            <div className="shrink-0">
                                                {showAvatar ? (
                                                    <div className="w-10 h-10 bg-rpg-blue border-2 border-rpg-brown flex items-center justify-center font-display font-bold text-rpg-brown">
                                                        {getSenderName(m.sender_id).slice(0, 1).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10" />
                                                )}
                                            </div>
                                        )}

                                        {/* Message bubble */}
                                        <div className="flex flex-col">
                                            {/* Sender name */}
                                            {!isOwn && showAvatar && (
                                                <span className="text-xs text-rpg-brown/70 font-display font-medium mb-1 ml-2">
                                                    {getSenderName(m.sender_id)}
                                                </span>
                                            )}

                                            <div className={`relative px-4 py-3 font-display text-sm border-2 border-rpg-brown shadow-[2px_2px_0_0_rgba(74,59,50,0.2)] ${isOwn
                                                ? 'bg-primary-light text-rpg-brown pixel-speech-right'
                                                : 'bg-white text-rpg-brown pixel-speech-left'
                                                }`}>
                                                {/* Reply quote */}
                                                {m.replyTo && (
                                                    <div className={`mb-2 px-3 py-2 text-xs border-l-2 ${isOwn ? 'bg-primary/10 border-primary' : 'bg-rpg-blue/50 border-rpg-brown'}`}>
                                                        <p className="font-semibold opacity-80">
                                                            {m.replyTo.sender_id === userId ? 'You' : getSenderName(m.replyTo.sender_id)}
                                                        </p>
                                                        <p className="truncate opacity-70">{m.replyTo.body?.slice(0, 50)}</p>
                                                    </div>
                                                )}

                                                {/* Image */}
                                                {m.fileUrl && m.fileType?.startsWith('image/') && (
                                                    <img src={m.fileUrl} alt={m.fileName || 'Image'} className="w-full border-2 border-rpg-brown object-cover max-h-64 mb-2" />
                                                )}

                                                {/* Audio */}
                                                {m.fileUrl && (m.fileType?.startsWith('audio/') || m.fileName?.includes('voice') || m.body?.startsWith('🎤 Voice message')) && (
                                                    <AudioMessage audioUrl={m.fileUrl} isOwn={isOwn} />
                                                )}

                                                {/* Text */}
                                                {m.body && !(m.fileUrl && m.body.startsWith('🎤 Voice message')) && (
                                                    <p className="break-words whitespace-pre-wrap">{m.body}</p>
                                                )}

                                                {m.isEdited && (
                                                    <span className="text-[10px] text-rpg-brown/50 ml-2">(edited)</span>
                                                )}
                                            </div>

                                            {/* Timestamp */}
                                            <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <span className="text-[10px] text-rpg-brown/50 font-display opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {formatMessageTime(m.createdAt)}
                                                </span>
                                                {isOwn && (
                                                    <span className={`text-[10px] font-display ${m.readAt ? 'text-primary' : 'text-rpg-brown/40'}`}>
                                                        {m.readAt ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Reactions */}
                                            {groupedReactions.length > 0 && (
                                                <div className={`flex gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    {groupedReactions.slice(0, 3).map((r, i) => (
                                                        <span key={i} className="text-xs bg-white border border-rpg-brown px-1.5 py-0.5 shadow-[1px_1px_0_0_rgba(74,59,50,0.2)]">
                                                            {r.emoji} {r.count > 1 && r.count}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                            <button
                                                onClick={() => onReply(m)}
                                                className="p-1.5 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                                                title="Reply"
                                            >
                                                <Reply className="w-4 h-4" />
                                            </button>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setOpenEmojiPickerId(openEmojiPickerId === m.id ? null : m.id); }}
                                                    className="p-1.5 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                                                >
                                                    <Smile className="w-4 h-4" />
                                                </button>
                                                {openEmojiPickerId === m.id && (
                                                    <div className={`absolute bottom-full mb-1 z-50 bg-white border-2 border-rpg-brown shadow-pixel p-2 flex gap-1 ${isOwn ? 'right-0' : 'left-0'}`}>
                                                        {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => { onReaction(m.id, emoji); setOpenEmojiPickerId(null); }}
                                                                className="text-sm hover:bg-rpg-blue p-1.5 hover:scale-110 transition-transform border-2 border-transparent hover:border-rpg-brown"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {isOwn && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === m.id ? null : m.id); }}
                                                        className="p-1.5 text-rpg-brown hover:bg-rpg-blue border-2 border-transparent hover:border-rpg-brown transition-all"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {openMenuId === m.id && (
                                                        <div className="absolute top-full mt-1 right-0 z-50 bg-white border-2 border-rpg-brown shadow-pixel overflow-hidden min-w-[100px]">
                                                            <button
                                                                onClick={() => { setEditingMessageId(m.id); setEditContent(m.body); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-xs text-left text-rpg-brown font-display font-medium hover:bg-rpg-blue transition-colors"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button
                                                                onClick={() => { onDeleteMessage(m); setOpenMenuId(null); }}
                                                                className="w-full px-4 py-2.5 text-xs text-left text-red-500 font-display font-medium hover:bg-red-50 transition-colors"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* Typing Indicator */}
            <TypingIndicator />
        </div>
    );
}
