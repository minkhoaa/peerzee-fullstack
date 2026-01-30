"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { VideoStage } from "@/components/match/VideoStage";
import { ChatPanel } from "@/components/match/ChatPanel";
import { ModeSelector } from "@/components/match/ModeSelector";
import { useVideoDating } from "@/hooks/useVideoDating";

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

export default function MatchPage() {
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get('session');
  const modeFromUrl = searchParams.get('mode') as 'text' | 'video' | null;

  const [mode, setMode] = useState<"text" | "video" | null>(modeFromUrl);
  const [interests, setInterests] = useState<string[]>([]);
  const [messages, setMessages] = useState<Array<{ sender: "me" | "stranger" | "system"; content: string; timestamp: Date }>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

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
    reportPartner,
    // Blind Date features
    blindDate,
    requestNewTopic,
    requestReveal,
    acceptReveal,
    joinRoom,
  } = useVideoDating();

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // We no longer auto-join because we need user gesture for media access
  // The ModeSelector will now show a specialized button if sessionRoomId is present

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

  const handleStart = (selectedMode: "text" | "video", selectedInterests: string[], intentMode: IntentMode, genderPref: GenderPref, matchingType: 'normal' | 'semantic', searchQuery?: string) => {
    setMode(selectedMode);
    setInterests(selectedInterests);

    const enableCamera = selectedMode === "video";
    setIsCameraOff(!enableCamera);

    // Use the selected intentMode, genderPref, matchingType, and optional query
    if (sessionFromUrl) {
      joinRoom(sessionFromUrl, selectedMode === "video");
    } else {
      joinQueue(intentMode, genderPref, enableCamera, matchingType, searchQuery);
    }

    setMessages([{
      sender: "system",
      content: searchQuery
        ? `[AI] Searching for: "${searchQuery}"...`
        : matchingType === 'semantic'
          ? "[AI] Finding your perfect match..."
          : selectedMode === "video"
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

  const handleReport = () => {
    if (reportReason.trim()) {
      reportPartner(reportReason);
      setShowReportModal(false);
      setReportReason('');
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
    return <ModeSelector onStart={handleStart} queueSize={queueSize} error={error} sessionRoomId={sessionFromUrl} />;
  }

  return (
    <>
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
          onReport={() => setShowReportModal(true)}
          // Blind Date features
          blindDate={blindDate}
          onRequestTopic={requestNewTopic}
          onRequestReveal={requestReveal}
          onAcceptReveal={acceptReveal}
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-cocoa/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-retro-white border-3 border-cocoa rounded-xl p-6 max-w-sm w-full mx-4 shadow-pixel">
            <h3 className="text-lg font-pixel uppercase tracking-wider text-cocoa mb-4">Report User</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full px-4 py-3 bg-retro-bg border-2 border-cocoa rounded-xl text-cocoa placeholder-cocoa-light font-body font-bold resize-none focus:outline-none focus:border-pixel-pink shadow-pixel-sm"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-2.5 text-cocoa-light hover:text-cocoa hover:bg-cocoa/20 border-2 border-cocoa rounded-xl font-body font-bold transition-colors shadow-pixel-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="flex-1 py-2.5 bg-pixel-red text-retro-bg border-2 border-cocoa rounded-xl font-pixel uppercase tracking-wider hover:bg-pixel-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-pixel-sm"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
