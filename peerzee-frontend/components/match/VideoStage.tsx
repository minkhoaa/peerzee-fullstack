"use client";

import { useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Loader2, User } from "lucide-react";
import { VideoDatingState } from "@/hooks/useVideoDating";

interface VideoStageProps {
  mode: "text" | "video";
  state: VideoDatingState;
  interests: string[];
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  remoteHasVideo: boolean;
  withVideo: boolean;
  isCameraOff: boolean;
  isMuted: boolean;
  onStop: () => void;
  onNext: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
}

export function VideoStage({
  mode,
  state,
  interests,
  localStream,
  remoteStream,
  remoteHasVideo,
  withVideo,
  isCameraOff,
  isMuted,
  onStop,
  onNext,
  onToggleMute,
  onToggleCamera,
}: VideoStageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isSearching = state === 'searching';
  const isConnected = state === 'matched' || state === 'connected';

  return (
    <div className="flex-[2] h-full bg-[#FDF0F1] rounded-[40px] shadow-xl shadow-[#CD6E67]/10 relative overflow-hidden flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative m-4 rounded-[30px] overflow-hidden bg-gradient-to-br from-[#E5C0C5] to-[#ECC8CD]">
        {mode === "video" && isConnected ? (
          <>
            {/* Remote Video (Stranger) */}
            <div className="absolute inset-0">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${!remoteHasVideo ? 'opacity-0' : ''}`}
                  />
                  {!remoteHasVideo && (
                    <div className="absolute inset-0 bg-[#E5C0C5] flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-[#CD6E67]/30 flex items-center justify-center mb-3">
                        <User className="w-10 h-10 text-[#CD6E67]" />
                      </div>
                      <div className="flex items-center gap-2 text-[#7A6862]">
                        <VideoOff className="w-4 h-4" />
                        <span className="text-sm font-medium">Partner camera off</span>
                      </div>
                    </div>
                  )}
                  {/* Status indicator */}
                  {state === 'matched' && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full text-xs text-[#CD6E67] font-bold">
                      Connecting...
                    </div>
                  )}
                  {state === 'connected' && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#CD6E67]/20 backdrop-blur-sm rounded-full text-xs text-[#CD6E67] font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#CD6E67] animate-pulse" />
                      Connected
                    </div>
                  )}
                </>
              ) : (
                <SearchingPlaceholder isSearching={isSearching} interests={interests} />
              )}
            </div>

            {/* Local Video (Me - PIP) */}
            {localStream && (
              <div className="absolute bottom-4 left-4 w-32 h-48 bg-[#3E3229]/20 backdrop-blur-md rounded-[20px] border-2 border-white shadow-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                />
                {(!withVideo || isCameraOff) && (
                  <div className="absolute inset-0 bg-[#3E3229] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#CD6E67] flex items-center justify-center mb-2">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 text-white text-xs">
                      <VideoOff className="w-3 h-3" />
                      <span>Camera off</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded text-xs text-white font-medium">
                  You
                </div>
              </div>
            )}
          </>
        ) : (
          <PlaceholderContent mode={mode} state={state} interests={interests} />
        )}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center pb-6 gap-2">
        {/* Mute Button */}
        {isConnected && (
          <>
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-full transition-all shadow-md ${
                isMuted 
                  ? 'bg-red-400 text-white' 
                  : 'bg-white text-[#CD6E67] hover:bg-[#F8E3E6]'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            {mode === "video" && (
              <button
                onClick={onToggleCamera}
                className={`p-3 rounded-full transition-all shadow-md ${
                  isCameraOff 
                    ? 'bg-red-400 text-white' 
                    : 'bg-white text-[#CD6E67] hover:bg-[#F8E3E6]'
                }`}
                title={isCameraOff ? "Turn on camera" : "Turn off camera"}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}
          </>
        )}

        {/* Stop & Next Buttons */}
        <button
          onClick={onStop}
          className="bg-[#3E3229] text-white px-8 py-4 rounded-l-full font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2"
        >
          <span className="text-sm">ESC</span>
          <span className="text-base">STOP</span>
        </button>
        <button
          onClick={onNext}
          disabled={!isConnected}
          className="bg-[#CD6E67] text-white px-10 py-4 rounded-r-full font-extrabold text-lg hover:bg-[#B55B55] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="text-xl">NEXT</span>
          <span className="text-sm">ENTER</span>
        </button>
      </div>
    </div>
  );
}

function SearchingPlaceholder({ isSearching, interests }: { isSearching: boolean; interests: string[] }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#CD6E67]/20 rounded-full animate-ping" />
        <div className="relative bg-white rounded-full p-8 shadow-2xl shadow-[#CD6E67]/30">
          <Loader2 className="w-16 h-16 text-[#CD6E67] animate-spin" />
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h3 className="text-[#3E3229] text-2xl font-extrabold mb-2">
          {isSearching ? "Looking for a friend..." : "Ready to connect"}
        </h3>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-white text-[#CD6E67] px-4 py-2 rounded-full text-sm font-bold shadow-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cute Animation */}
      <div className="text-6xl animate-bounce">🧸</div>
    </div>
  );
}

function PlaceholderContent({ mode, state, interests }: { mode: "text" | "video"; state: VideoDatingState; interests: string[] }) {
  const isSearching = state === 'searching';
  
  if (mode === "text" && (state === 'matched' || state === 'connected')) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
        <div className="bg-white rounded-full p-6 shadow-xl shadow-[#CD6E67]/20">
          <div className="w-24 h-24 rounded-full bg-[#CD6E67] flex items-center justify-center text-white text-4xl font-extrabold">
            ?
          </div>
        </div>
        <h3 className="text-[#3E3229] text-3xl font-extrabold">Text Chat Mode</h3>
        <p className="text-[#7A6862] text-lg font-medium">You're chatting with a stranger</p>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-white text-[#CD6E67] px-3 py-1.5 rounded-full text-sm font-bold shadow-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
        <div className="text-5xl">💬</div>
      </div>
    );
  }

  return <SearchingPlaceholder isSearching={isSearching} interests={interests} />;
}
