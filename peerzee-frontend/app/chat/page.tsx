"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useTheme } from "@/lib/theme";
import api, { userApi, chatApi } from "@/lib/api";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallModal from "@/components/AudioCallModal";
import { PixelButton, CarvedInput } from "@/components/village";
import { GlobalHeader } from "@/components/layout";
import { MessageCircle, Search, Phone, Video, Send, Paperclip, X, Mic, LogOut, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

const setPageTitle = (title: string) => {
    if (typeof window !== "undefined") {
        window.document.title = title;
    }
};

export default function ChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useTheme();

    // Core state
    const [userId, setUserId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // UI state
    const [showModal, setShowModal] = useState(false);
    const [newUserId, setNewUserId] = useState("");
    const [newConvName, setNewConvName] = useState("");
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ id: string; email: string; fullName?: string }[]>([]);
    const [searching, setSearching] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [_userEmails, setUserEmails] = useState<Record<string, string>>({});

    // Message editing/replying
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    // File upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Refs
    const socketRef = useRef<Socket | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);
    const notificationSound = useRef<HTMLAudioElement | null>(null);
    const userIdRef = useRef<string | null>(null);
    const activeConversationRef = useRef<Conversation | null>(null);
    const processedMsgIds = useRef<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // WebRTC call state
    const {
        callState,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleCamera,
        localStream,
        remoteStream,
        remoteHasVideo,
        withVideo,
        handleAnswer,
        handleIceCandidate,
        remoteAudio,
    } = useWebRTC(socketRef);

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callType, setCallType] = useState<"audio" | "video">("audio");
    const [incomingCall, setIncomingCall] = useState<{
        conversation_id: string;
        user_id: string;
        offer: RTCSessionDescriptionInit;
        callType?: "audio" | "video";
    } | null>(null);

    // ============== CALL HANDLERS ==============
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
            const withVideoCall = incomingCall.callType === "video";
            setCallType(incomingCall.callType || "audio");
            answerCall(incomingCall.conversation_id, incomingCall.offer, withVideoCall);
            setIncomingCall(null);
        }
    };

    const handleDeclineCall = () => {
        if (incomingCall && socketRef.current) {
            socketRef.current.emit("call:end", { conversation_id: incomingCall.conversation_id });
        }
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        endCall();
        setIncomingCall(null);
        setCallType("audio");
        setIsCameraOff(false);
    };

    const handleStartAudioCall = () => {
        if (activeConversation) {
            setCallType("audio");
            startCall(activeConversation.id, false);
        }
    };

    const handleStartVideoCall = () => {
        if (activeConversation) {
            setCallType("video");
            startCall(activeConversation.id, true);
        }
    };

    const getCallerName = () => {
        if (incomingCall) {
            return userNames[incomingCall.user_id] || "Unknown";
        }
        if (activeConversation) {
            return activeConversation.name || "Unknown";
        }
        return "Unknown";
    };

    // ============== EFFECTS ==============
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        notificationSound.current = new Audio("/notification.mp3");
        notificationSound.current.volume = 0.5;
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Socket connection & events
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

            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
            setConversations((prev) =>
                prev.map((c) =>
                    c.id === data.conversation_id
                        ? { ...c, lastMessage: data.body, lastMessageAt: data.createdAt }
                        : c
                )
            );

            const currentUserId = userIdRef.current;
            const currentConv = activeConversationRef.current;

            if (data.sender_id !== currentUserId) {
                if (data.conversation_id !== currentConv?.id) {
                    setUnreadCounts((prev) => {
                        const newCounts = {
                            ...prev,
                            [data.conversation_id]: (prev[data.conversation_id] || 0) + 1,
                        };
                        const total = Object.values(newCounts).reduce<number>(
                            (sum, count) => sum + (Number(count) || 0),
                            0
                        );
                        setPageTitle(`(${total}) New messages - Peerzee`);
                        return newCounts;
                    });
                }
                if (document.hidden) {
                    notificationSound.current?.play().catch(() => { });
                    if (Notification.permission === "granted") {
                        new Notification("New Message", {
                            body: data.body?.slice(0, 50) || "You have a new message",
                            icon: "/favicon.ico",
                        });
                    }
                }
            }
        });

        socket.on("conversation:new", (data) => {
            setConversations((prev) => (prev.some((c) => c.id === data.id) ? prev : [...prev, data]));
        });

        socket.on("typing:update", (data: { conversation_id: string; user_id: string; display_name?: string; isTyping: boolean }) => {
            if (data.display_name && data.isTyping) {
                setUserNames((prev) => ({ ...prev, [data.user_id]: data.display_name! }));
            }
            setTypingUsers((prev) => {
                const current = prev[data.conversation_id] || [];
                if (data.isTyping) {
                    if (!current.includes(data.user_id)) {
                        return { ...prev, [data.conversation_id]: [...current, data.user_id] };
                    }
                } else {
                    return {
                        ...prev,
                        [data.conversation_id]: prev[data.conversation_id]?.filter((id) => id !== data.user_id) || [],
                    };
                }
                return prev;
            });
        });

        socket.on("message:edit", (data) => {
            setMessages((prev) =>
                prev.map((k) => (k.id === data.id ? { ...k, body: data.body, isEdited: data.isEdited } : k))
            );
        });

        socket.on("message:delete", (data) => {
            setMessages((prev) => prev.map((k) => (k.id === data.id ? { ...k, isDeleted: true } : k)));
        });

        socket.on("user:online-list", (userIds: string[]) => setOnlineUsers(new Set(userIds)));

        socket.on("user:online", ({ userId: uid, isOnline }) => {
            setOnlineUsers((prev) => {
                const next = new Set(prev);
                if (isOnline) {
                    next.add(uid);
                } else {
                    next.delete(uid);
                }
                return next;
            });
        });

        socket.on("reaction:added", (data) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === data.message_id
                        ? { ...m, reactions: [...(m.reactions || []), { emoji: data.emoji, user_id: data.user_id }] }
                        : m
                )
            );
        });

        socket.on("reaction:removed", (data) => {
            setMessages((prev) =>
                prev.map((k) =>
                    k.id === data.message_id
                        ? {
                            ...k,
                            reactions: k.reactions?.filter(
                                (r) => !(r.emoji === data.emoji && r.user_id === data.user_id)
                            ),
                        }
                        : k
                )
            );
        });

        socket.on("message:read", (data) => {
            setMessages((prev) => prev.map((m) => (m.id === data.message_id ? { ...m, readAt: data.readAt } : m)));
        });

        socket.on("call:offer", (data: { conversation_id: string; user_id: string; offer: RTCSessionDescriptionInit; callType?: "audio" | "video" }) => {
            if (data.user_id !== userIdRef.current) {
                setIncomingCall(data);
            }
        });

        socket.on("call:answer", async (data: { answer: RTCSessionDescriptionInit }) => {
            await handleAnswer(data.answer);
        });

        socket.on("call:ice-candidate", async (data: { candidate: RTCIceCandidateInit }) => {
            await handleIceCandidate(data.candidate);
        });

        socket.on("call:end", () => {
            endCall();
            setIncomingCall(null);
        });

        setLoading(false);

        return () => {
            disconnectSocket();
            socket.off("user:online-list");
            socket.off("user:online");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // Load conversations
    useEffect(() => {
        if (!userId) return;

        const loadConversations = async () => {
            const res = await api.get<
                (Conversation & {
                    participantInfo?: { user_id: string; email?: string; display_name?: string }[];
                })[]
            >(`/conversation`);
            setConversations(res.data);
            res.data.forEach((c) => {
                c.participantInfo?.forEach((p) => {
                    if (p.user_id !== userId) {
                        if (p.display_name) setUserNames((prev) => ({ ...prev, [p.user_id]: p.display_name! }));
                        if (p.email) setUserEmails((prev) => ({ ...prev, [p.user_id]: p.email! }));
                    }
                });
                const otherUserId = c.participantIds?.find((id) => id !== userId);
                const hasDisplayName = c.participantInfo?.some((p) => p.user_id === otherUserId && p.display_name);
                if (otherUserId && c.name && !hasDisplayName) {
                    setUserNames((prev) => ({ ...prev, [otherUserId]: c.name as string }));
                }
            });
        };
        loadConversations();
    }, [userId]);

    // Handle URL params
    useEffect(() => {
        const conversationId = searchParams.get("conversation");
        const draftMessage = searchParams.get("draft");

        if (conversationId && conversations.length > 0 && !activeConversation) {
            const conv = conversations.find((c) => c.id === conversationId);
            if (conv) {
                socketRef.current?.emit("conversation:join", { conversation_id: conv.id }, (msgs: Message[]) => {
                    setMessages(msgs || []);
                });
                setActiveConversation(conv);
                setUnreadCounts((prev) => ({ ...prev, [conv.id]: 0 }));
            }
        }

        if (draftMessage && !newMessage) {
            setNewMessage(decodeURIComponent(draftMessage));
            router.replace("/chat", { scroll: false });
        }
    }, [searchParams, conversations, activeConversation, newMessage, router]);

    // User search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await userApi.searchUsers(searchQuery);
                setSearchResults(res.data);
            } catch (err) {
                console.error(err);
            }
            setSearching(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ============== HANDLERS ==============
    const handleInputChange = useCallback(
        (value: string) => {
            setNewMessage(value);
            if (!activeConversation || !socketRef.current) return;
            if (!isTypingRef.current) {
                isTypingRef.current = true;
                socketRef.current.emit("typing:start", { conversation_id: activeConversation.id });
            }
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                isTypingRef.current = false;
                socketRef.current?.emit("typing:stop", { conversation_id: activeConversation.id });
            }, 1000);
        },
        [activeConversation]
    );

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith("image/")) {
                setPreviewUrl(URL.createObjectURL(file));
            }
        }
    }, []);

    const handleClearFile = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    const handleSend = async () => {
        if ((!newMessage.trim() && !selectedFile) || !activeConversation || !socketRef.current) return;

        let fileUrl = null,
            fileName = null,
            fileType = null;
        if (selectedFile) {
            try {
                const uploadRes = await chatApi.uploadFile(selectedFile);
                fileUrl = uploadRes.data.fileUrl;
                fileName = uploadRes.data.fileName;
                fileType = uploadRes.data.fileType;
            } catch (error) {
                console.log(error);
                return;
            }
        }

        socketRef.current.emit("conversation:send", {
            conversation_id: activeConversation.id,
            body: newMessage,
            fileUrl,
            fileName,
            fileType,
            reply_to_id: replyingTo?.id || null,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (isTypingRef.current && activeConversation) isTypingRef.current = false;
        socketRef.current?.emit("typing:stop", { conversation_id: activeConversation.id });
        setNewMessage("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setReplyingTo(null);
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversation(conv);
        socketRef.current?.emit("conversation:join", { conversation_id: conv.id }, (msgs: Message[]) => {
            setMessages(msgs || []);
            if (msgs?.length > 0) {
                const lastMessage = msgs[msgs.length - 1];
                if (lastMessage.sender_id !== userId && !lastMessage.readAt) {
                    socketRef.current?.emit("message:read", {
                        conversation_id: conv.id,
                        last_read_message_id: lastMessage.id,
                    });
                }
            }
        });
        setUnreadCounts((prev) => ({ ...prev, [conv.id]: 0 }));
        setPageTitle("Peerzee");
    };

    const handleCreateConversation = () => {
        if (!newUserId.trim() || !socketRef.current) return;
        socketRef.current.emit(
            "conversation:create",
            {
                type: "private",
                name: newConvName.trim(),
                participantUserIds: [newUserId.trim()],
            },
            (response: {
                conversationId: string;
                type: string;
                name: string;
                lastMessageAt: string | null;
                lastSeq: string;
            }) => {
                setActiveConversation({
                    id: response.conversationId,
                    type: response.type,
                    lastMessageAt: response.lastMessageAt,
                    lastSeq: response.lastSeq,
                    name: response.name,
                });
            }
        );
        setNewUserId("");
        setNewConvName("");
        setShowModal(false);
    };

    // ============== RENDER ==============
    if (loading) {
        return (
            <div className="h-screen w-full grass-dots flex items-center justify-center overflow-hidden">
                <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const otherUserId = activeConversation?.participantIds?.find((id) => id !== userId) || "";
    const isOtherOnline = onlineUsers.has(otherUserId);
    const currentTyping = activeConversation ? typingUsers[activeConversation.id] || [] : [];

    return (
        <div className="h-screen w-full grass-dots flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <header className="shrink-0 z-50 relative">
                <GlobalHeader
                    title="TAVERN"
                    subtitle="Messenger • Connected to Realm"
                    showBack
                    onBack={() => router.push('/discover')}
                    showNotifications={false}
                />
            </header>

            {/* Main Stage - Takes all remaining height */}
            <main className="flex-1 flex gap-4 p-4 min-h-0 max-w-7xl mx-auto w-full">
                {/* Left Sidebar - Fixed width, full height */}
                <aside className="w-80 shrink-0 h-full bg-[var(--wood-dark)] border-4 border-[var(--wood-shadow)] shadow-[6px_6px_0_var(--border-dark)] flex flex-col rounded-sm">
                    <div className="flex-1 flex flex-col min-h-0 bg-[var(--parchment)]">
                        {/* Header */}
                        <div className="shrink-0 p-4 border-b-3 border-[var(--wood-dark)]">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-pixel text-lg text-wood-dark">COMPANIONS</h2>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-landscape-green' : 'bg-primary-red'}`} />
                                    <span className="text-xs text-wood-dark/60">{isConnected ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            <PixelButton
                                variant="primary"
                                size="sm"
                                className="w-full"
                                onClick={() => setShowModal(true)}
                            >
                                + NEW QUEST
                            </PixelButton>
                        </div>

                        {/* Conversation List - Scrollable */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {conversations.map((conv) => {
                                const convOtherUserId = conv.participantIds?.find((id) => id !== userId) || "";
                                const isOnline = onlineUsers.has(convOtherUserId);
                                const unread = unreadCounts[conv.id] || 0;
                                const isTypingHere = typingUsers[conv.id]?.length > 0;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`w-full p-4 text-left border-b-2 border-wood-dark/20 transition-colors ${
                                            activeConversation?.id === conv.id
                                                ? 'bg-primary-orange/20'
                                                : 'hover:bg-cork/30'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-accent-blue border-2 border-wood-dark flex items-center justify-center">
                                                    <span className="font-pixel text-parchment">
                                                        {(userNames[convOtherUserId] || conv.name || '?')[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                {isOnline && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-landscape-green border-2 border-wood-dark rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-pixel text-sm text-wood-dark truncate">
                                                        {userNames[convOtherUserId] || conv.name || 'Unknown'}
                                                    </span>
                                                    {unread > 0 && (
                                                        <span className="bg-primary-red text-parchment text-xs px-2 py-0.5 font-pixel">
                                                            {unread}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-wood-dark/60 truncate">
                                                    {isTypingHere ? 'typing...' : conv.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {conversations.length === 0 && (
                                <div className="p-8 text-center">
                                    <MessageCircle className="w-12 h-12 text-wood-dark/30 mx-auto mb-3" />
                                    <p className="text-sm text-wood-dark/60">No conversations yet</p>
                                </div>
                            )}
                        </div>

                        {/* Footer - Fixed bottom */}
                        <div className="shrink-0 p-4 border-t-3 border-[var(--wood-dark)] bg-[var(--cork)] flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 bg-[var(--parchment)] border-2 border-[var(--wood-dark)] flex items-center justify-center hover:bg-[var(--parchment-dark)]"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5 text-[var(--wood-dark)]" /> : <Moon className="w-5 h-5 text-[var(--wood-dark)]" />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 h-10 bg-[var(--primary-red)] border-2 border-[var(--wood-dark)] flex items-center justify-center gap-2 text-[var(--parchment)] hover:opacity-80"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-pixel text-sm">LOGOUT</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right Chat Window - Flex grow, full height */}
                <section className="flex-1 h-full bg-[var(--wood-dark)] border-4 border-[var(--wood-shadow)] shadow-[6px_6px_0_var(--border-dark)] flex flex-col rounded-sm overflow-hidden">
                    {activeConversation ? (
                        <div className="flex-1 flex flex-col min-h-0 bg-[var(--parchment)]">
                            {/* Chat Header - Fixed */}
                            <div className="shrink-0 p-4 border-b-3 border-[var(--wood-dark)] bg-[var(--parchment-dark)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--wood-dark)] flex items-center justify-center">
                                        <span className="font-pixel text-[var(--parchment)]">
                                            {(userNames[otherUserId] || activeConversation.name || '?')[0].toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-pixel text-[var(--wood-dark)]">
                                            {userNames[otherUserId] || activeConversation.name || 'Unknown'}
                                        </h3>
                                        <p className="text-xs text-[var(--wood-dark)]/60">
                                            {isOtherOnline ? '🟢 Online' : '⚫ Offline'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleStartAudioCall}
                                        className="w-10 h-10 bg-[var(--landscape-green)] border-2 border-[var(--wood-dark)] flex items-center justify-center hover:opacity-80"
                                    >
                                        <Phone className="w-5 h-5 text-[var(--parchment)]" />
                                    </button>
                                    <button
                                        onClick={handleStartVideoCall}
                                        className="w-10 h-10 bg-[var(--accent-blue)] border-2 border-[var(--wood-dark)] flex items-center justify-center hover:opacity-80"
                                    >
                                        <Video className="w-5 h-5 text-[var(--parchment)]" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area - MUST SCROLL */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--parchment)] min-h-0">
                                {messages.map((msg) => {
                                    const isMine = msg.sender_id === userId;

                                    if (msg.isDeleted) {
                                        return (
                                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className="bg-cork/30 border-2 border-dashed border-wood-dark/30 px-4 py-2 text-wood-dark/50 text-sm italic">
                                                    Message deleted
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] ${
                                                    isMine
                                                        ? 'bg-primary-orange text-parchment'
                                                        : 'bg-parchment border-2 border-wood-dark text-wood-dark'
                                                } px-4 py-3`}
                                            >
                                                {msg.replyTo && (
                                                    <div className={`text-xs mb-2 pb-2 border-b ${isMine ? 'border-parchment/30' : 'border-wood-dark/30'}`}>
                                                        ↩ {msg.replyTo.body.slice(0, 50)}
                                                    </div>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                                                {msg.fileUrl && (
                                                    <div className="mt-2">
                                                        {msg.fileType?.startsWith('image/') ? (
                                                            <img src={msg.fileUrl} alt="" className="max-w-full rounded" />
                                                        ) : (
                                                            <a
                                                                href={msg.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="underline text-sm"
                                                            >
                                                                📎 {msg.fileName}
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                <div className={`text-xs mt-1 ${isMine ? 'text-parchment/60' : 'text-wood-dark/60'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {msg.isEdited && ' (edited)'}
                                                    {isMine && msg.readAt && ' ✓✓'}
                                                </div>
                                                {msg.reactions && msg.reactions.length > 0 && (
                                                    <div className="flex gap-1 mt-2">
                                                        {msg.reactions.map((r, i) => (
                                                            <span key={i} className="text-sm">{r.emoji}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}

                                {currentTyping.length > 0 && (
                                    <div className="flex items-center gap-2 text-wood-dark/60 text-sm">
                                        <span className="animate-pulse">●</span>
                                        <span>{currentTyping.map(id => userNames[id] || 'Someone').join(', ')} is typing...</span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Preview */}
                            <AnimatePresence>
                                {replyingTo && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 py-2 bg-cork/30 border-t-2 border-wood-dark flex items-center justify-between"
                                    >
                                        <div className="text-sm text-wood-dark">
                                            <span className="text-wood-dark/60">Replying to:</span> {replyingTo.body.slice(0, 50)}
                                        </div>
                                        <button onClick={() => setReplyingTo(null)}>
                                            <X className="w-4 h-4 text-wood-dark" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* File Preview */}
                            <AnimatePresence>
                                {selectedFile && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="px-4 py-2 bg-cork/30 border-t-2 border-wood-dark flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="" className="w-12 h-12 object-cover border-2 border-wood-dark" />
                                            ) : (
                                                <Paperclip className="w-5 h-5 text-wood-dark" />
                                            )}
                                            <span className="text-sm text-wood-dark">{selectedFile.name}</span>
                                        </div>
                                        <button onClick={handleClearFile}>
                                            <X className="w-4 h-4 text-wood-dark" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input Area - Fixed Bottom */}
                            <div className="shrink-0 p-4 border-t-3 border-[var(--wood-dark)] bg-[var(--cork)]">
                                <div className="flex items-center gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-10 h-10 bg-cork border-2 border-wood-dark flex items-center justify-center hover:bg-cork/70"
                                    >
                                        <Paperclip className="w-5 h-5 text-wood-dark" />
                                    </button>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Type your message..."
                                        className="flex-1 px-4 py-3 bg-parchment border-3 border-wood-dark text-wood-dark placeholder-wood-dark/40 focus:border-primary-orange outline-none"
                                    />
                                    <PixelButton
                                        variant="primary"
                                        onClick={handleSend}
                                        disabled={!newMessage.trim() && !selectedFile}
                                    >
                                        <Send className="w-5 h-5" />
                                    </PixelButton>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[var(--parchment)]">
                            <div className="w-20 h-20 bg-[var(--accent-blue)] border-4 border-[var(--wood-dark)] flex items-center justify-center mb-6">
                                <MessageCircle className="w-10 h-10 text-[var(--parchment)]" />
                            </div>
                            <h3 className="font-pixel text-2xl text-[var(--wood-dark)] mb-2">SELECT A QUEST</h3>
                            <p className="text-[var(--wood-dark)]/60">Choose a companion from the sidebar to start chatting</p>
                        </div>
                    )}
                </section>
            </main>

            {/* New Chat Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-parchment border-4 border-wood-dark w-full max-w-md p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-pixel text-2xl text-wood-dark">NEW QUEST</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 bg-cork border-2 border-wood-dark hover:bg-primary-red hover:text-parchment flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <CarvedInput
                                label="Quest Name"
                                pixelLabel
                                value={newConvName}
                                onChange={(e) => setNewConvName(e.target.value)}
                                placeholder="Optional name..."
                            />

                            <div className="relative">
                                <CarvedInput
                                    label="Search Player"
                                    pixelLabel
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by email..."
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-parchment border-3 border-wood-dark">
                                        {searchResults.map((user) => (
                                            <button
                                                key={user.id}
                                                onClick={() => {
                                                    setNewUserId(user.id);
                                                    setSearchQuery(user.email);
                                                    setSearchResults([]);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-cork/50 border-b border-wood-dark/20 last:border-b-0"
                                            >
                                                <div className="font-pixel text-sm text-wood-dark">{user.email}</div>
                                                {user.fullName && (
                                                    <div className="text-xs text-wood-dark/60">{user.fullName}</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searching && (
                                    <div className="absolute z-10 mt-1 w-full px-4 py-3 bg-parchment border-3 border-wood-dark text-sm text-wood-dark">
                                        🔍 Searching...
                                    </div>
                                )}
                            </div>

                            {newUserId && (
                                <div className="text-sm text-landscape-green font-pixel">
                                    ✓ Player selected
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-6">
                            <PixelButton
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowModal(false)}
                            >
                                CANCEL
                            </PixelButton>
                            <PixelButton
                                variant="success"
                                className="flex-1"
                                onClick={handleCreateConversation}
                                disabled={!newUserId}
                            >
                                START QUEST
                            </PixelButton>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Call Modal */}
            {(callState !== "idle" || incomingCall) && (
                <CallModal
                    callState={incomingCall && callState === "idle" ? "ringing" : callState}
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
                    withVideo={withVideo}
                />
            )}
        </div>
    );
}
