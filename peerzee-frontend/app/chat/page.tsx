"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useTheme } from "@/lib/theme";
import api, { userApi, chatApi } from "@/lib/api";
import { useWebRTC } from "@/hooks/useWebRTC";
import CallModal from "@/components/AudioCallModal";
import { MessageSquareText, Loader2 } from "lucide-react";

// Import refactored components
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";

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
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

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
                        setPageTitle(`(${total}) Tin nhắn mới - Peerzee`);
                        return newCounts;
                    });
                }
                if (document.hidden) {
                    notificationSound.current?.play().catch(() => { });
                    if (Notification.permission === "granted") {
                        new Notification("New Message", {
                            body: data.body?.slice(0, 50) || "Bạn có tin nhắn mới",
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

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            setPreviewUrl(URL.createObjectURL(file));
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

    const handleVoiceMessage = async (blob: Blob, duration: number) => {
        if (!activeConversation || !socketRef.current) return;

        const file = new File([blob], "voice_message.webm", { type: "audio/webm" });
        const uploadRes = await chatApi.uploadFile(file);

        socketRef.current.emit("conversation:send", {
            conversation_id: activeConversation.id,
            body: `🎤 Voice message (${duration}s)`,
            fileUrl: uploadRes.data.fileUrl,
            fileName: uploadRes.data.fileName || "voice_message.webm",
            fileType: uploadRes.data.fileType || "audio/webm",
        });
    };

    const handleEditMessage = (messageId: string, content: string) => {
        if (!activeConversation || !socketRef.current) return;
        socketRef.current.emit("message:edit", {
            message_id: messageId,
            body: content.trim(),
            conversation_id: activeConversation.id,
        });
    };

    const handleDeleteMessage = (m: Message) => {
        if (!activeConversation || !socketRef.current) return;
        socketRef.current.emit("message:delete", {
            message_id: m.id,
            conversation_id: activeConversation.id,
        });
    };

    const handleReaction = (messageId: string, emoji: string) => {
        if (!activeConversation || !socketRef.current) return;
        const message = messages.find((m) => m.id === messageId);
        const alreadyReacted = message?.reactions?.some((r) => r.emoji === emoji && r.user_id === userId);
        socketRef.current.emit(alreadyReacted ? "reaction:remove" : "reaction:add", {
            message_id: messageId,
            emoji,
            conversation_id: activeConversation.id,
        });
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

    const handleSearchMessage = async (query: string) => {
        if (!query.trim() || !activeConversation || !socketRef.current) return;
        const response = await new Promise<{ ok: boolean; results?: Message[] }>((resolve) => {
            socketRef.current?.emit(
                "message:search",
                {
                    conversation_id: activeConversation.id,
                    query: query.trim(),
                },
                resolve
            );
        });
        if (response.ok && response.results && response.results.length > 0) {
            const firstResult = response.results[0];
            setHighlightedMessageId(firstResult.id);
            const element = document.getElementById(`message-${firstResult.id}`);
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => setHighlightedMessageId(null), 3000);
        }
    };

    const handleSendIcebreaker = (question: string) => {
        if (!activeConversation || !socketRef.current) return;
        socketRef.current.emit("conversation:send", {
            conversation_id: activeConversation.id,
            body: question,
        });
    };

    // ============== RENDER ==============
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-retro-bg">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-8 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-3 border-cocoa rounded-xl bg-pixel-pink flex items-center justify-center shadow-pixel-sm animate-pixelBounce">
                        <MessageSquareText className="w-8 h-8 text-cocoa" strokeWidth={2.5} />
                    </div>
                    <span className="font-pixel text-cocoa uppercase tracking-widest">Loading...</span>
                </div>
            </div>
        );
    }

    const otherUserId = activeConversation?.participantIds?.find((id) => id !== userId) || "";
    const isOtherOnline = onlineUsers.has(otherUserId);

    return (
        <div className="h-screen w-full bg-retro-bg p-4 flex gap-4 overflow-hidden font-body">
            {/* Sidebar */}
            <ChatSidebar
                conversations={conversations}
                activeConversation={activeConversation}
                userId={userId}
                isConnected={isConnected}
                theme={theme}
                unreadCounts={unreadCounts}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                userNames={userNames}
                onSelectConversation={handleSelectConversation}
                onNewChat={() => setShowModal(true)}
                onToggleTheme={toggleTheme}
                onLogout={handleLogout}
            />

            {/* Main Chat Area */}
            <div className="flex-1 h-full bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel flex flex-col relative overflow-hidden">
                {activeConversation ? (
                    <>
                        <ChatWindow
                            conversation={activeConversation}
                            messages={messages}
                            userId={userId}
                            isOnline={isOtherOnline}
                            userNames={userNames}
                            typingUsers={typingUsers[activeConversation.id] || []}
                            highlightedMessageId={highlightedMessageId}
                            onStartAudioCall={handleStartAudioCall}
                            onStartVideoCall={handleStartVideoCall}
                            onEndCall={handleEndCall}
                            onEditMessage={handleEditMessage}
                            onDeleteMessage={handleDeleteMessage}
                            onReaction={handleReaction}
                            onReply={setReplyingTo}
                            onSearchMessage={handleSearchMessage}
                            callState={callState}
                            onSendIcebreaker={handleSendIcebreaker}
                        />

                        <ChatInput
                            value={newMessage}
                            onChange={handleInputChange}
                            onSend={handleSend}
                            onFileSelect={handleFileSelect}
                            onVoiceMessage={handleVoiceMessage}
                            replyingTo={replyingTo}
                            onCancelReply={() => setReplyingTo(null)}
                            selectedFile={selectedFile}
                            previewUrl={previewUrl}
                            onClearFile={handleClearFile}
                            disabled={!activeConversation}
                            userId={userId}
                            conversationId={activeConversation?.id || null}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 border-3 border-cocoa rounded-xl bg-pixel-blue flex items-center justify-center mb-5 shadow-pixel">
                            <MessageSquareText className="w-12 h-12 text-cocoa" strokeWidth={2.5} />
                        </div>
                        <h3 className="font-pixel text-cocoa text-xl uppercase tracking-widest mb-2">NO CHAT SELECTED</h3>
                        <p className="text-cocoa-light font-bold">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>

            {/* New Chat Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-cocoa/50 flex items-center justify-center z-50">
                    <div className="bg-retro-paper border-3 border-cocoa rounded-xl shadow-pixel-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-pixel text-cocoa text-xl uppercase tracking-widest">New Chat</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-10 h-10 border-2 border-cocoa rounded-lg bg-pixel-red text-white hover:bg-red-500 transition-colors flex items-center justify-center"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <input
                            value={newConvName}
                            onChange={(e) => setNewConvName(e.target.value)}
                            placeholder="Conversation name"
                            className="w-full px-4 py-3 text-sm bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-inset text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-pink mb-3 font-bold"
                        />

                        <div className="relative mb-4">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by email..."
                                className="w-full px-4 py-3 text-sm bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-inset text-cocoa placeholder-cocoa-light focus:outline-none focus:ring-2 focus:ring-pixel-pink font-bold"
                            />
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel max-h-40 overflow-y-auto z-10">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                setNewUserId(user.id);
                                                setSearchQuery(user.email);
                                                setSearchResults([]);
                                            }}
                                            className="px-4 py-3 text-sm cursor-pointer hover:bg-pixel-blue border-b-2 border-cocoa/20 last:border-b-0 transition-colors text-cocoa font-bold"
                                        >
                                            <div>{user.email}</div>
                                            {user.fullName && user.fullName !== "string" && (
                                                <div className="text-xs text-cocoa-light">{user.fullName}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searching && (
                                <div className="absolute top-full left-0 right-0 mt-2 px-4 py-3 text-xs text-cocoa-light bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel font-bold flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.5} /> Searching...
                                </div>
                            )}
                        </div>

                        {newUserId && (
                            <div className="flex items-center gap-2 text-xs text-pixel-green mb-4 font-bold bg-pixel-green/20 border-2 border-pixel-green rounded-lg px-3 py-2">
                                <span>✓</span>
                                <span>Selected: {searchQuery}</span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 text-sm font-pixel uppercase tracking-wider border-3 border-cocoa rounded-lg text-cocoa bg-retro-white hover:bg-retro-bg transition-colors shadow-pixel-sm active:translate-y-0.5 active:shadow-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateConversation}
                                className="flex-1 py-3 text-sm font-pixel uppercase tracking-wider bg-pixel-pink border-3 border-cocoa text-cocoa rounded-lg hover:bg-pixel-pink-dark shadow-pixel-sm transition-all active:translate-y-0.5 active:shadow-none"
                            >
                                Create
                            </button>
                        </div>
                    </div>
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
