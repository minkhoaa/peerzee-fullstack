"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useTheme } from "@/lib/theme";
import api from "@/lib/api";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallModal from "@/components/AudioCallModal";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import AudioMessage from "@/components/chat/AudioMessage";
import NotificationPopover from "@/components/NotificationPopover";


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
    reactions?: { emoji: string, user_id: string }[];
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
}

// SVG Icons
const Icons = {
    send: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
    ),
    attach: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    ),
    plus: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
    ),
    more: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
    ),
    close: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    smile: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    logout: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    ),
    check: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
    ),
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
    sun: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    moon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
    user: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    search: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    reply: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
    ),
};


const setPageTitle = (title: string) => {
    if (typeof window !== 'undefined') {
        window.document.title = title;
    }
};

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useTheme();
    const [userId, setUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUserId, setNewUserId] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const [newConvName, setNewConvName] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>("");
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [searchResults, setSearchResults] = useState<{ id: string, email: string, fullName?: string }[]>([]);
    const [searching, setSearching] = useState(false);
    const [openEmojiPickerId, setOpenEmojiPickerId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Message search state
    const [messageSearchQuery, setMessageSearchQuery] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const userIdRef = useRef<string | null>(null);
    const activeConversationRef = useRef<Conversation | null>(null);
    const processedMsgIds = useRef<Set<string>>(new Set());
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [_userEmails, setUserEmails] = useState<Record<string, string>>({});


    const {
        callState,
        activeCallConversationId: _activeCallConversationId,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleCamera,
        localStream,
        remoteStream,
        remoteHasVideo,
        handleAnswer,
        handleIceCandidate,
        remoteAudio
    } = useWebRTC(socketRef);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callType, setCallType] = useState<'audio' | 'video'>('audio');
    const [incomingCall, setIncomingCall] = useState<{
        conversation_id: string,
        user_id: string, offer: RTCSessionDescriptionInit,
        callType?: 'audio' | 'video'
    } | null>(null);

    // Audio call handlers
    const handleToggleMute = () => {
        const newMuteState = toggleMute();
        setIsMuted(newMuteState ?? false);
    };

    const handleToggleCamera = () => {
        const newCameraState = toggleCamera();
        setIsCameraOff(newCameraState ?? false);
    };

    const handleAnswerCall = () => {
        if (incomingCall) {
            const withVideo = incomingCall.callType === 'video';
            setCallType(incomingCall.callType || 'audio');
            answerCall(incomingCall.conversation_id, incomingCall.offer, withVideo);
            setIncomingCall(null);
        }
    };

    const handleDeclineCall = () => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit('call:end', { conversation_id: incomingCall.conversation_id });
        }
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        endCall();
        setIncomingCall(null);
        setCallType('audio');
        setIsCameraOff(false);
    };

    const handleStartAudioCall = () => {
        if (activeConversation) {
            setCallType('audio');
            startCall(activeConversation.id, false);
        }
    };

    const handleStartVideoCall = () => {
        if (activeConversation) {
            setCallType('video');
            startCall(activeConversation.id, true);
        }
    };

    // Get caller name for incoming call
    const getCallerName = () => {
        if (incomingCall) {
            return userNames[incomingCall.user_id] || 'Unknown';
        }
        if (activeConversation) {
            return activeConversation.name || 'Unknown';
        }
        return 'Unknown';
    };







    useEffect(() => {
        userIdRef.current = userId;
    }, [userId])
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation])
    useEffect(() => {
        const handleClickOutside = () => {
            if (openEmojiPickerId) setOpenEmojiPickerId(null);
            if (openMenuId) setOpenMenuId(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openEmojiPickerId, openMenuId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get(`/user/search?q=${encodeURIComponent(searchQuery)}`);
                setSearchResults(res.data);
            } catch (err) {
                console.error(err);
            }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default')
            Notification.requestPermission();
        notificationSound.current = new Audio('/notification.mp3');
        notificationSound.current.volume = 0.5;
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const uid = localStorage.getItem("userId");
        if (!token || !uid) {
            router.push("/login");
            return;
        }

        setUserId(uid);
        const socket = connectSocket(token);
        socketRef.current = socket;

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));
        socket.on("message:new", (data) => {
            if (processedMsgIds.current.has(data.id)) return;
            processedMsgIds.current.add(data.id);

            setMessages((prev) => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
            setConversations(prev => prev.map(c => c.id === data.conversation_id ?
                { ...c, lastMessage: data.body, lastMessageAt: data.createdAt } : c));

            const currentUserId = userIdRef.current;
            const currentConv = activeConversationRef.current;

            // Chỉ xử lý notification nếu không phải tin nhắn của mình
            if (data.sender_id !== currentUserId) {
                // Tăng unread count nếu không phải conversation đang active
                if (data.conversation_id !== currentConv?.id) {
                    setUnreadCounts(prev => {
                        const newCounts = { ...prev, [data.conversation_id]: (prev[data.conversation_id] || 0) + 1 };
                        const total = Object.values(newCounts).reduce<number>((sum, count) => sum + (Number(count) || 0), 0);
                        setPageTitle(`(${total}) Tin nhắn mới - Peerzee`);
                        return newCounts;
                    });
                }
                // Notification khi tab hidden
                if (document.hidden) {
                    notificationSound.current?.play().catch(() => { });
                    if (Notification.permission === 'granted') {
                        new Notification('New Message', {
                            body: data.body?.slice(0, 50) || 'Bạn có tin nhắn mới',
                            icon: '/favicon.ico'
                        });
                    }
                }
            }
        });
        socket.on('conversation:new', (data) => {
            setConversations((prev) => prev.some(c => c.id === data.id) ? prev : [...prev, data]);
        });
        socket.on('typing:update', (data: { conversation_id: string, user_id: string; display_name?: string; isTyping: boolean }) => {
            // Lưu display_name nếu có
            if (data.display_name && data.isTyping) {
                setUserNames(prev => ({ ...prev, [data.user_id]: data.display_name! }));
            }
            setTypingUsers((prev) => {
                const current = prev[data.conversation_id] || [];
                if (data.isTyping) {
                    if (!current.includes(data.user_id)) {
                        return { ...prev, [data.conversation_id]: [...current, data.user_id] };
                    }
                } else {
                    return { ...prev, [data.conversation_id]: prev[data.conversation_id]?.filter((id) => id !== data.user_id) || [] };
                }
                return prev;
            });
        });
        socket.on('message:edit', (data) => {
            setMessages(prev => prev.map(k => k.id === data.id ? { ...k, body: data.body, isEdited: data.isEdited } : k));
        });
        socket.on('message:delete', (data) => {
            setMessages(prev => prev.map(k => k.id === data.id ? { ...k, isDeleted: true } : k));
        });
        socket.on('user:online-list', (userIds: string[]) => setOnlineUsers(new Set(userIds)));
        socket.on('user:online', ({ userId, isOnline }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                if (isOnline) {
                    next.add(userId);
                } else {
                    next.delete(userId);
                }
                return next;
            });
        });
        socket.on('reaction:added', data => {
            setMessages(prev => prev.map(m =>
                m.id === data.message_id ? { ...m, reactions: [...(m.reactions || []), { emoji: data.emoji, user_id: data.user_id }] } : m
            ));
        });
        socket.on('reaction:removed', data => {
            setMessages(prev => prev.map(k =>
                k.id === data.message_id ? { ...k, reactions: k.reactions?.filter(r => !(r.emoji === data.emoji && r.user_id === data.user_id)) } : k
            ));
        });
        socket.on('message:read', (data) => {
            setMessages(prev => prev.map(m => m.id === data.message_id ? { ...m, readAt: data.readAt } : m));
        });

        socket.on('call:offer', (data: { conversation_id: string, user_id: string, offer: RTCSessionDescriptionInit }) => {
            if (data.user_id !== userIdRef.current) {
                setIncomingCall(data);
            }
        })
        socket.on('call:answer', async (data: { answer: RTCSessionDescriptionInit }) => {
            await handleAnswer(data.answer);
        })
        socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
            await handleIceCandidate(data.candidate);
        });
        socket.on('call:end', () => {
            endCall();
            setIncomingCall(null);
        });

        setLoading(false);
        return () => {
            disconnectSocket();
            socket.off('user:online-list');
            socket.off('user:online');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    useEffect(() => {
        if (!userId) return;
        const loadConversations = async () => {
            const res = await api.get<(Conversation & { participantInfo?: { user_id: string; email?: string; display_name?: string }[] })[]>(`/conversation`);
            setConversations(res.data);
            res.data.forEach(c => {
                // Extract user info from participantInfo (priority)
                c.participantInfo?.forEach(p => {
                    if (p.user_id !== userId) {
                        if (p.display_name) setUserNames(prev => ({ ...prev, [p.user_id]: p.display_name! }));
                        if (p.email) setUserEmails(prev => ({ ...prev, [p.user_id]: p.email! }));
                    }
                });
                // Fallback to conversation name ONLY if no participantInfo display_name
                const otherUserId = c.participantIds?.find(id => id !== userId);
                const hasDisplayName = c.participantInfo?.some(p => p.user_id === otherUserId && p.display_name);
                if (otherUserId && c.name && !hasDisplayName) {
                    setUserNames(prev => ({ ...prev, [otherUserId]: c.name as string }));
                }
            });
        };
        loadConversations();
    }, [userId]);

    // Handle URL params: conversation=id&draft=message
    useEffect(() => {
        const conversationId = searchParams.get('conversation');
        const draftMessage = searchParams.get('draft');

        if (conversationId && conversations.length > 0 && !activeConversation) {
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
                // Auto-select conversation
                socketRef.current?.emit("conversation:join", { conversation_id: conv.id }, (msgs: Message[]) => {
                    setMessages(msgs || []);
                });
                setActiveConversation(conv);
                setUnreadCounts(prev => ({ ...prev, [conv.id]: 0 }));
            }
        }

        // Pre-fill draft message
        if (draftMessage && !newMessage) {
            setNewMessage(decodeURIComponent(draftMessage));
            // Clear the URL params after using them
            router.replace('/chat', { scroll: false });
        }
    }, [searchParams, conversations, activeConversation, newMessage, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!activeConversation || !socketRef.current) return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socketRef.current.emit('typing:start', { conversation_id: activeConversation.id });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socketRef.current?.emit('typing:stop', { conversation_id: activeConversation.id });
        }, 1000);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedFile || !activeConversation || !socketRef.current) return;

        let fileUrl = null, fileName = null, fileType = null;
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            try {
                const res = await api.post("/chat/upload", formData, { headers: { "Content-Type": undefined } });
                fileUrl = res.data.fileUrl;
                fileName = res.data.fileName;
                fileType = res.data.fileType;
            } catch (error) {
                console.log(error);
                return;
            }
        }

        socketRef.current.emit("conversation:send", {
            conversation_id: activeConversation.id,
            body: newMessage,
            fileUrl, fileName, fileType,
            reply_to_id: replyingTo?.id || null,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current && activeConversation) isTypingRef.current = false;
        socketRef.current?.emit('typing:stop', { conversation_id: activeConversation.id });
        setNewMessage("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setReplyingTo(null);
    };

    const handleEditSubmit = () => {
        if (!activeConversation || !socketRef.current) return;
        socketRef.current.emit("message:edit", {
            message_id: editingMessageId,
            body: editContent.trim(),
            conversation_id: activeConversation.id,
        });
        setEditingMessageId(null);
        setEditContent("");
    };

    const handleDelete = (m: Message) => {
        if (!activeConversation || !socketRef.current) return;
        socketRef.current.emit("message:delete", {
            message_id: m.id,
            conversation_id: activeConversation.id,
        });
    };

    const handleReaction = (messageId: string, emoji: string) => {
        if (!activeConversation || !socketRef.current) return;
        const message = messages.find(m => m.id === messageId);
        const alreadyReacted = message?.reactions?.some(r => r.emoji === emoji && r.user_id === userId);
        socketRef.current.emit(alreadyReacted ? "reaction:remove" : "reaction:add", {
            message_id: messageId,
            emoji,
            conversation_id: activeConversation.id,
        });
    };

    const handleMessageSearch = async () => {
        if (!messageSearchQuery.trim() || !activeConversation || !socketRef.current) return;
        const response = await new Promise<{ ok: boolean; results?: Message[] }>((resolve) => {
            socketRef.current?.emit("message:search", {
                conversation_id: activeConversation.id,
                query: messageSearchQuery.trim(),
            }, resolve);
        });
        if (response.ok && response.results) {
            if (response.results.length > 0) {
                const firstResult = response.results[0];
                setHighlightedMessageId(firstResult.id);
                // Scroll to message
                const element = document.getElementById(`message-${firstResult.id}`);
                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Clear highlight after 3 seconds
                setTimeout(() => setHighlightedMessageId(null), 3000);
            }
        }
    };

    const typingIndicator = (() => {
        const typing = activeConversation ? typingUsers[activeConversation.id] || [] : [];
        if (typing.length === 0) return null;
        return (
            <div className="px-5 py-2 flex items-center gap-2">
                <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {typing.length === 1
                        ? `${userNames[typing[0]] || 'Someone'} is typing`
                        : `${typing.length} people typing`}
                </span>
            </div>
        );
    })();

    const handleCreate = () => {
        if (!newUserId.trim() || !socketRef.current) return;
        socketRef.current.emit("conversation:create", {
            type: 'private',
            name: newConvName.trim(),
            participantUserIds: [newUserId.trim()],
        }, (response: { conversationId: string, type: string, name: string, lastMessageAt: string | null, lastSeq: string }) => {
            setActiveConversation({
                id: response.conversationId,
                type: response.type,
                lastMessageAt: response.lastMessageAt,
                lastSeq: response.lastSeq,
                name: response.name,
            });
        });
        setNewUserId("");
        setNewConvName("");
        setShowModal(false);
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        socketRef.current?.emit("conversation:join", { conversation_id: conv.id }, (messages: Message[]) => {
            setMessages(messages || []);
            if (messages?.length > 0) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.sender_id !== userId && !lastMessage.readAt) {
                    socketRef.current?.emit("message:read", {
                        conversation_id: conv.id,
                        last_read_message_id: lastMessage.id
                    });
                }
            }
        });
        setUnreadCounts(prev => {
            const updated = { ...prev, [conv.id]: 0 };
            return updated;
        });
        // Reset title when selecting conversation
        setPageTitle("Peerzee");
    };



    const getBubbleRadius = (m: Message, index: number) => {
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        const isFirstInGroup = !prevMessage || prevMessage.sender_id !== m.sender_id || prevMessage.isDeleted;
        const isLastInGroup = !nextMessage || nextMessage.sender_id !== m.sender_id || nextMessage.isDeleted;

        if (m.sender_id === userId) {
            if (isFirstInGroup && isLastInGroup) return "rounded-2xl rounded-tr-md";
            if (isFirstInGroup) return "rounded-2xl rounded-tr-md rounded-br-lg";
            if (isLastInGroup) return "rounded-2xl rounded-tr-lg rounded-br-md";
            return "rounded-2xl rounded-r-lg";
        } else {
            if (isFirstInGroup && isLastInGroup) return "rounded-2xl rounded-tl-md";
            if (isFirstInGroup) return "rounded-2xl rounded-tl-md rounded-bl-lg";
            if (isLastInGroup) return "rounded-2xl rounded-tl-lg rounded-bl-md";
            return "rounded-2xl rounded-l-lg";
        }
    };

    const getMessageSpacing = (index: number) => {
        const prevMessage = messages[index - 1];
        const currentMessage = messages[index];
        if (!prevMessage) return "mt-0";
        return prevMessage.sender_id !== currentMessage.sender_id || prevMessage.isDeleted ? "mt-4" : "mt-0.5";
    };

    // Show avatar only on the last message of a consecutive group from the same sender
    const shouldShowAvatar = (index: number) => {
        const currentMessage = messages[index];
        const nextMessage = messages[index + 1];
        // Show avatar if this is the last message OR next message is from different sender
        return !nextMessage || nextMessage.sender_id !== currentMessage.sender_id || nextMessage.isDeleted;
    };

    // Get sender name from userNames or generate from id
    const getSenderName = (senderId: string) => {
        return userNames[senderId] || senderId.slice(0, 8);
    };

    // Check if this is the first message in a group from the same sender
    const isFirstInMessageGroup = (index: number) => {
        const currentMessage = messages[index];
        const prevMessage = messages[index - 1];
        // First in group if no previous message OR previous message is from different sender
        return !prevMessage || prevMessage.sender_id !== currentMessage.sender_id || prevMessage.isDeleted;
    };

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-neutral-900 font-bold text-sm">P</span>
                </div>
                <span className="text-neutral-500 dark:text-neutral-400 text-sm">Loading...</span>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen overflow-hidden overflow-x-hidden max-w-full bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased transition-colors duration-300">
            {/* Sidebar */}
            <div className="w-72 shrink-0 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-700 via-neutral-900 to-black dark:from-white dark:via-neutral-200 dark:to-neutral-300 flex items-center justify-center shadow-lg">
                                <span className="text-white dark:text-neutral-900 font-bold text-sm">P</span>
                            </div>
                            <span className="font-semibold text-lg">Peerzee</span>
                            <span className={`w-2 h-2 rounded-full transition-colors ${isConnected ? "bg-green-500 animate-pulse" : "bg-neutral-300"}`}></span>
                        </div>
                        <div className="flex items-center gap-0.5">
                            <button onClick={toggleTheme} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all hover:scale-105">
                                {theme === "light" ? Icons.moon : Icons.sun}
                            </button>
                            <Link href="/profile" className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all hover:scale-105">
                                {Icons.user}
                            </Link>
                            <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:scale-105">
                                {Icons.logout}
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowModal(true)} className="flex-1 py-2.5 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all flex items-center justify-center gap-2">
                            {Icons.plus}
                            New Chat
                        </button>
                        <Link href="/discover" className="py-2.5 px-3 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center" title="Discover">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </Link>
                        <Link href="/community" className="py-2.5 px-3 text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center justify-center" title="Community">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </Link>
                        <Link href="/video-dating" className="py-2.5 px-3 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all flex items-center justify-center" title="Video Dating">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {conversations.map((c) => {
                        const otherUserId = c.participantIds?.find(id => id !== userId) || '';
                        const isActive = activeConversation?.id === c.id;
                        return (
                            <div
                                key={c.id}
                                onClick={() => handleSelectConversation(c)}
                                className={`relative px-3 py-3.5 cursor-pointer transition-all flex gap-3 border-b border-neutral-50 dark:border-neutral-800/50 ${isActive
                                    ? "bg-neutral-100 dark:bg-neutral-800"
                                    : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}
                            >
                                {/* Active Accent Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-neutral-900 dark:bg-neutral-400 rounded-r-full" />
                                )}
                                <div className="relative">
                                    <div className={`w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-semibold text-sm ${isActive ? 'ring-2 ring-neutral-300 dark:ring-neutral-600' : ''}`}>
                                        {c.name?.slice(0, 1)?.toUpperCase() || "?"}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-950 transition-colors ${onlineUsers.has(otherUserId) ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-2">
                                        <span className={`font-medium text-sm truncate ${isActive ? 'text-neutral-900 dark:text-white' : ''}`}>{c.name || "Unknown"}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-neutral-400">
                                                {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ""}
                                            </span>
                                            {unreadCounts[c.id] > 0 && (
                                                <span className="min-w-5 h-5 px-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse-glow">
                                                    {unreadCounts[c.id] > 9 ? '9+' : unreadCounts[c.id]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>{c.lastMessage || "No messages yet"}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-neutral-100 dark:border-neutral-800 bg-gradient-to-t from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950">
                    <p className="text-[10px] text-neutral-400 font-mono truncate">ID: {userId?.slice(0, 20)}...</p>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-900">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="shrink-0 px-6 py-4 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-medium text-sm">
                                    {activeConversation.name?.slice(0, 1)?.toUpperCase() || "?"}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${onlineUsers.has(activeConversation.participantIds?.find(id => id !== userId) || '') ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-600"}`} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">{activeConversation.name}</h2>
                                <p className={`text-xs ${onlineUsers.has(activeConversation.participantIds?.find(id => id !== userId) || '') ? "text-green-600" : "text-neutral-400"}`}>
                                    {onlineUsers.has(activeConversation.participantIds?.find(id => id !== userId) || '') ? "Online" : "Offline"}
                                </p>
                            </div>
                            {/* Search Toggle */}
                            <div className="ml-auto flex items-center gap-2">
                                {/* Call Buttons */}
                                {callState === 'idle' ? (
                                    <>
                                        {/* Audio Call Button */}
                                        <button
                                            onClick={handleStartAudioCall}
                                            className="p-2 text-neutral-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                            title="Audio Call"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                        {/* Video Call Button */}
                                        <button
                                            onClick={handleStartVideoCall}
                                            className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Video Call"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleEndCall}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors animate-pulse"
                                        title="End Call"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                                        </svg>
                                    </button>
                                )}
                                {showSearchBar ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={messageSearchQuery}
                                            onChange={(e) => setMessageSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleMessageSearch()}
                                            placeholder="Search messages..."
                                            className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white w-48"
                                            autoFocus
                                        />
                                        <button onClick={handleMessageSearch} className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
                                            {Icons.search}
                                        </button>
                                        <button onClick={() => { setShowSearchBar(false); setMessageSearchQuery(""); }} className="p-1.5 text-neutral-400 hover:text-neutral-600">
                                            {Icons.close}
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowSearchBar(true)} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                        {Icons.search}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {messages.map((m, index) => (
                                <div
                                    key={m.id}
                                    id={`message-${m.id}`}
                                    className={`flex ${getMessageSpacing(index)} ${m.sender_id === userId ? "justify-end" : "justify-start"} ${highlightedMessageId === m.id ? "animate-pulse bg-yellow-100 dark:bg-yellow-900/30 -mx-2 px-2 rounded-lg" : ""} animate-[slideIn_0.2s_ease-out]`}
                                    style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                                >
                                    {m.isDeleted ? (
                                        <div className={`flex items-end gap-2 ${m.sender_id === userId ? "flex-row-reverse" : "flex-row"}`}>
                                            {/* Avatar placeholder for alignment */}
                                            {m.sender_id !== userId && (
                                                <div className="w-7 h-7 shrink-0" />
                                            )}
                                            <div className={`max-w-[70%] px-4 py-2.5 ${getBubbleRadius(m, index)} ${m.sender_id === userId
                                                ? "bg-neutral-900 dark:bg-neutral-700"
                                                : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"}`}>
                                                <span className="text-sm text-neutral-400 dark:text-neutral-500 italic">Message deleted</span>
                                            </div>
                                        </div>
                                    ) : editingMessageId === m.id ? (
                                        <div className="flex flex-col gap-2 max-w-[70%]">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent resize-none"
                                                rows={2}
                                                autoFocus
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => { setEditingMessageId(null); setEditContent(""); }} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                                                    Cancel
                                                </button>
                                                <button onClick={handleEditSubmit} className="px-3 py-1.5 text-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            {/* Sender name - show above first message in group */}
                                            {m.sender_id !== userId && isFirstInMessageGroup(index) && (
                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 ml-9">
                                                    {getSenderName(m.sender_id)}
                                                </span>
                                            )}
                                            <div className={`group flex items-end gap-2 ${m.sender_id === userId ? "flex-row-reverse" : "flex-row"}`}>
                                                {/* Avatar - only show for other users, and only on last message of group */}
                                                {m.sender_id !== userId && (
                                                    <div className="shrink-0 mb-0.5">
                                                        {shouldShowAvatar(index) ? (
                                                            <div className="w-7 h-7 rounded-full bg-neutral-600 dark:bg-neutral-500 flex items-center justify-center text-white text-xs font-medium">
                                                                {getSenderName(m.sender_id).slice(0, 1).toUpperCase()}
                                                            </div>
                                                        ) : (
                                                            <div className="w-7 h-7" /> /* Invisible placeholder for alignment */
                                                        )}
                                                    </div>
                                                )}
                                                {/* Message Bubble */}
                                                <div className={`relative max-w-[70%] ${getBubbleRadius(m, index)} ${m.sender_id === userId
                                                    ? "bg-neutral-900 dark:bg-neutral-700 text-white"
                                                    : "bg-neutral-700 dark:bg-neutral-700 text-white"} transition-all duration-200`}>
                                                    {/* Quoted Reply */}
                                                    {m.replyTo && (
                                                        <div className={`mx-2 mt-2 px-3 py-2 rounded-lg text-xs border-l-2 ${m.sender_id === userId ? "bg-neutral-800 dark:bg-neutral-600 border-neutral-600 dark:border-neutral-500" : "bg-neutral-100 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-500"}`}>
                                                            <p className={`font-medium mb-0.5 ${m.sender_id === userId ? "text-neutral-400 dark:text-neutral-500" : "text-neutral-500 dark:text-neutral-400"}`}>
                                                                {m.replyTo.sender_id === userId ? "You" : "Reply"}
                                                            </p>
                                                            <p className={`truncate ${m.sender_id === userId ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-600 dark:text-neutral-300"}`}>
                                                                {m.replyTo.body?.slice(0, 50)}{m.replyTo.body?.length > 50 ? "..." : ""}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {m.fileUrl && m.fileType?.startsWith('image/') && (
                                                        <img
                                                            src={m.fileUrl}
                                                            alt={m.fileName || 'Image'}
                                                            className="w-full rounded-t-2xl object-cover max-h-64"
                                                        />
                                                    )}
                                                    {/* Audio Message Playback - with fallback detection */}
                                                    {m.fileUrl && (m.fileType?.startsWith('audio/') || m.fileName?.includes('voice') || m.body?.startsWith('🎤 Voice message')) && (
                                                        <div className="px-2 py-2">
                                                            <AudioMessage
                                                                audioUrl={m.fileUrl}
                                                                isOwn={m.sender_id === userId}
                                                            />
                                                        </div>
                                                    )}
                                                    {/* Text body - hide if it's just voice message placeholder with audio */}
                                                    {m.body && !(m.fileUrl && m.body.startsWith('🎤 Voice message')) && (
                                                        <p className="px-4 py-2.5 text-sm break-words whitespace-pre-wrap">{m.body}</p>
                                                    )}
                                                    {/* Timestamp tooltip on hover */}
                                                    <span className={`absolute top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none ${m.sender_id === userId ? "right-full mr-2" : "left-full ml-2"}`}>
                                                        {formatMessageTime(m.createdAt)}
                                                    </span>
                                                    {m.isEdited && (
                                                        <span className={`absolute -bottom-4 text-[10px] text-neutral-400 ${m.sender_id === userId ? "right-0" : "left-0"}`}>edited</span>
                                                    )}
                                                    {/* Reactions */}
                                                    {m.reactions && m.reactions.length > 0 && (
                                                        <div className={`absolute -bottom-3 flex gap-0.5 ${m.sender_id === userId ? "right-2" : "left-2"}`}>
                                                            {[...new Set(m.reactions.map(r => r.emoji))].slice(0, 3).map((emoji, i) => (
                                                                <span key={i} className="text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full px-1 shadow-sm">{emoji}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* Seen Status - only for sender's messages */}
                                                    {m.sender_id === userId && index === messages.length - 1 && (
                                                        <div className="absolute -bottom-5 right-0 flex items-center gap-1">
                                                            <span className={m.readAt ? "text-blue-500" : "text-neutral-400"}>
                                                                {m.readAt ? Icons.doubleCheck : Icons.singleCheck}
                                                            </span>
                                                            {m.readAt && (
                                                                <span className="text-[10px] text-blue-500">Seen</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Reply Button */}
                                                    <button
                                                        onClick={() => setReplyingTo(m)}
                                                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                        title="Reply"
                                                    >
                                                        {Icons.reply}
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setOpenEmojiPickerId(openEmojiPickerId === m.id ? null : m.id); }}
                                                            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                        >
                                                            {Icons.smile}
                                                        </button>
                                                        {openEmojiPickerId === m.id && (
                                                            <div className={`absolute bottom-full mb-1 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-1.5 flex gap-0.5 ${m.sender_id === userId ? 'right-0' : 'left-0'}`}>
                                                                {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => { handleReaction(m.id, emoji); setOpenEmojiPickerId(null); }}
                                                                        className="text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded p-1.5 hover:scale-110 transition-transform"
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
                                                                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                                                            >
                                                                {Icons.more}
                                                            </button>
                                                            {openMenuId === m.id && (
                                                                <div className="absolute top-full mt-1 right-0 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
                                                                    <button
                                                                        onClick={() => { setEditingMessageId(m.id); setEditContent(m.body); setOpenMenuId(null); }}
                                                                        className="w-full px-3 py-2 text-xs text-left text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { handleDelete(m); setOpenMenuId(null); }}
                                                                        className="w-full px-3 py-2 text-xs text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

                        {typingIndicator}

                        {/* File Preview */}
                        {selectedFile && (
                            <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center gap-3">
                                {previewUrl && (
                                    <img src={previewUrl} alt="Preview" className="h-12 w-12 object-cover rounded-lg" />
                                )}
                                <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-1 truncate">{selectedFile.name}</span>
                                <button
                                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    {Icons.close}
                                </button>
                            </div>
                        )}

                        {/* Reply Preview Bar */}
                        {replyingTo && (
                            <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                                <div className="flex-1 min-w-0 border-l-2 border-neutral-400 pl-3">
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Replying to {replyingTo.sender_id === userId ? "yourself" : "message"}
                                    </p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                                        {replyingTo.body?.slice(0, 60)}{replyingTo.body?.length > 60 ? "..." : ""}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                >
                                    {Icons.close}
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <form onSubmit={handleSend} className="shrink-0 p-4 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-800 rounded-full px-4 py-2.5">
                                <input type="file" ref={fileInputRef} hidden onChange={handleFileSelect} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    {Icons.attach}
                                </button>
                                {/* Voice Recorder */}
                                <VoiceRecorder
                                    disabled={!activeConversation}
                                    onSendAudio={async (blob, duration) => {
                                        // Upload to server - must clear Content-Type for FormData
                                        const formData = new FormData();
                                        formData.append('file', blob, 'voice_message.webm');
                                        const res = await api.post('/chat/upload', formData, {
                                            headers: { 'Content-Type': undefined }
                                        });
                                        console.log('Upload response:', res.data);
                                        // Send as audio message - use actual upload response
                                        socketRef.current?.emit('conversation:send', {
                                            conversation_id: activeConversation?.id,
                                            body: `🎤 Voice message (${duration}s)`,
                                            fileUrl: res.data.fileUrl,
                                            fileName: res.data.fileName || 'voice_message.webm',
                                            fileType: res.data.fileType || 'audio/webm',
                                        });
                                    }}
                                />
                                <input
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                                    className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none placeholder-neutral-400"
                                />
                                <button type="submit" className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                                    {Icons.send}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl w-80 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="font-semibold">New Chat</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                                    {Icons.close}
                                </button>
                            </div>

                            <input
                                value={newConvName}
                                onChange={(e) => setNewConvName(e.target.value)}
                                placeholder="Conversation name"
                                className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent mb-3"
                            />

                            <div className="relative mb-4">
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by email..."
                                    className="w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                                        {searchResults.map(user => (
                                            <div
                                                key={user.id}
                                                onClick={() => { setNewUserId(user.id); setSearchQuery(user.email); setSearchResults([]); }}
                                                className="px-4 py-3 text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-50 dark:border-neutral-700 last:border-b-0"
                                            >
                                                <div className="font-medium">{user.email}</div>
                                                {user.fullName && user.fullName !== 'string' && (
                                                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{user.fullName}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searching && (
                                    <div className="absolute top-full left-0 right-0 mt-1 px-4 py-3 text-xs text-neutral-400 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg">
                                        Searching...
                                    </div>
                                )}
                            </div>

                            {newUserId && (
                                <div className="flex items-center gap-2 text-xs text-green-600 mb-4">
                                    {Icons.check}
                                    <span>Selected: {searchQuery}</span>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleCreate} className="flex-1 py-3 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Call Modal */}
            {(callState !== 'idle' || incomingCall) && (
                <CallModal
                    callState={incomingCall && callState === 'idle' ? 'ringing' : callState}
                    callType={incomingCall?.callType || callType}
                    callerName={getCallerName()}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    onToggleMute={handleToggleMute}
                    onToggleCamera={handleToggleCamera}
                    onEndCall={handleEndCall}
                    onAnswer={handleAnswerCall}
                    onDecline={handleDeclineCall}
                    isIncoming={!!incomingCall}
                    remoteAudioRef={remoteAudio}
                    localStreamRef={localStream}
                    remoteStream={remoteStream}
                    remoteHasVideo={remoteHasVideo}
                />
            )}
        </div >
    );
}
