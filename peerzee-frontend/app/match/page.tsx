"use client";

import { useState, useEffect } from "react";
import { VideoStage } from "@/components/match/VideoStage";
import { ChatPanel } from "@/components/match/ChatPanel";
import { ModeSelector } from "@/components/match/ModeSelector";
import { useVideoDating } from "@/hooks/useVideoDating";
import { Metadata } from "next";

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

const metadata : Metadata = {
  title: "Peerzee - Match",
  description: "Connect with peers",
}


export default function MatchPage() {
  const [mode, setMode] = useState<"text" | "video" | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{ sender: "me" | "stranger" | "system"; content: string; timestamp: Date }>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const {
    state,
    matchInfo,
    error,
    localStream,
    remoteStream,
    remoteHasVideo,
    withVideo,
    queueSize,
    socket,
    connect,
    disconnect,
    joinQueue,
    leaveQueue,
    nextPartner,
    endCall,
  } = useVideoDating();

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for incoming chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (data: { sender: string; content: string; timestamp: string }) => {
      console.log('[CHAT] Received message:', data);
      setMessages(prev => [...prev, {
        sender: data.sender as "me" | "stranger" | "system",
        content: data.content,
        timestamp: new Date(data.timestamp)
      }]);
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [socket]);

  const handleStart = (selectedMode: "text" | "video", selectedInterests: string[], intentMode: IntentMode, genderPref: GenderPref) => {
    setMode(selectedMode);
    setInterests(selectedInterests);
    
    const enableCamera = selectedMode === "video";
    setIsCameraOff(!enableCamera);
    
    // Use the selected intentMode and genderPref
    joinQueue(intentMode, genderPref, enableCamera);
    
    setMessages([{ 
      sender: "system", 
      content: selectedMode === "video" 
        ? "Looking for someone to video chat with..." 
        : "Looking for someone who likes " + selectedInterests.join(", ") + "...", 
      timestamp: new Date() 
    }]);
  };

  const handleStop = () => {
    endCall();
    setMessages([...messages, { sender: "system", content: "You disconnected.", timestamp: new Date() }]);
    setMode(null);
    setInterests([]);
    setMessages([]);
  };

  const handleNext = () => {
    nextPartner();
    setMessages([{ sender: "system", content: "Finding someone new...", timestamp: new Date() }]);
  };

  const handleToggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const handleSendMessage = (message: string) => {
    setMessages([...messages, { sender: "me", content: message, timestamp: new Date() }]);
    
    // Send via socket
    if (socket) {
      console.log('[CHAT] Sending message:', message);
      socket.emit("chat:message", { message }, (response: any) => {
        console.log('[CHAT] Server response:', response);
      });
    } else {
      console.error('[CHAT] Socket not available');
    }
  };

  // Monitor state changes
  useEffect(() => {
    if (state === 'matched' || state === 'connected') {
      if (matchInfo && messages.length === 1) {
        setMessages([...messages, { sender: "system", content: "You're now chatting with a stranger!", timestamp: new Date() }]);
      }
    } else if (state === 'ended') {
      setMessages([...messages, { sender: "system", content: "Stranger disconnected.", timestamp: new Date() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, matchInfo]);

  // Show mode selector if not started or in idle state
  if (!mode || state === 'idle') {
    return <ModeSelector onStart={handleStart} queueSize={queueSize} error={error} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-retro-bg p-4 flex gap-4 overflow-hidden flex-col lg:flex-row">
      {/* Left Panel: Video/Stage */}
      <VideoStage
        mode={mode}
        state={state}
        interests={interests}
        localStream={localStream}
        remoteStream={remoteStream}
        remoteHasVideo={remoteHasVideo}
        withVideo={withVideo}
        isCameraOff={isCameraOff}
        isMuted={isMuted}
        onStop={handleStop}
        onNext={handleNext}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
      />

      {/* Right Panel: Chat */}
      <ChatPanel
        state={state}
        matchInfo={matchInfo}
        interests={interests}
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
