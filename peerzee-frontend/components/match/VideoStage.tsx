"use client";

import { useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Loader2, User, Zap } from "lucide-react";
import { VideoDatingState } from "@/hooks/useVideoDating";
import { PixelButton, WoodenFrame } from "@/components/village";

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
    <div className="flex-[2] h-full">
      <WoodenFrame className="h-full flex flex-col">
        {/* Main Video Area */}
        <div className="flex-1 relative m-4 border-3 border-wood-dark overflow-hidden bg-wood-dark">
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
                      <div className="absolute inset-0 bg-parchment flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-cork border-3 border-wood-dark flex items-center justify-center mb-3">
                          <User className="w-10 h-10 text-wood-dark" />
                        </div>
                        <div className="flex items-center gap-2 text-wood-dark">
                          <VideoOff className="w-4 h-4" />
                          <span className="font-pixel text-sm">CAMERA OFF</span>
                        </div>
                      </div>
                    )}
                    {/* Status indicator */}
                    {state === 'matched' && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-accent-yellow border-2 border-wood-dark">
                        <span className="font-pixel text-xs text-wood-dark">CONNECTING...</span>
                      </div>
                    )}
                    {state === 'connected' && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-landscape-green border-2 border-wood-dark flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-parchment rounded-full animate-pulse" />
                        <span className="font-pixel text-xs text-parchment">LIVE</span>
                      </div>
                    )}
                  </>
                ) : (
                  <SearchingPlaceholder isSearching={isSearching} interests={interests} />
                )}
              </div>

              {/* Local Video (Me - PIP) */}
              {localStream && (
                <div className="absolute bottom-4 left-4 w-32 h-48 bg-wood-dark border-3 border-parchment overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                  />
                  {(!withVideo || isCameraOff) && (
                    <div className="absolute inset-0 bg-wood-dark flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-primary-orange border-2 border-parchment flex items-center justify-center mb-2">
                        <User className="w-6 h-6 text-parchment" />
                      </div>
                      <div className="flex items-center gap-1.5 text-parchment text-xs">
                        <VideoOff className="w-3 h-3" />
                        <span className="font-pixel">OFF</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-xs text-parchment font-pixel">
                    YOU
                  </div>
                </div>
              )}
            </>
          ) : (
            <PlaceholderContent mode={mode} state={state} interests={interests} />
          )}
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-center pb-4 gap-3">
          {/* Mute Button */}
          {isConnected && (
            <>
              <button
                onClick={onToggleMute}
                className={`p-3 border-3 border-wood-dark transition-all ${
                  isMuted 
                    ? 'bg-primary-red text-parchment' 
                    : 'bg-parchment text-wood-dark hover:bg-cork'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Camera Toggle */}
              {mode === "video" && (
                <button
                  onClick={onToggleCamera}
                  className={`p-3 border-3 border-wood-dark transition-all ${
                    isCameraOff 
                      ? 'bg-primary-red text-parchment' 
                      : 'bg-parchment text-wood-dark hover:bg-cork'
                  }`}
                  title={isCameraOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
            </>
          )}

          {/* Stop & Next Buttons */}
          <PixelButton
            variant="secondary"
            onClick={onStop}
          >
            <span className="text-xs">ESC</span>
            STOP
          </PixelButton>
          <PixelButton
            variant="success"
            onClick={onNext}
            disabled={!isConnected}
          >
            NEXT
            <span className="text-xs">ENTER</span>
          </PixelButton>
        </div>
      </WoodenFrame>
    </div>
  );
}

function SearchingPlaceholder({ isSearching, interests }: { isSearching: boolean; interests: string[] }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 bg-parchment">
      {/* Animated Icon */}
      <div className="relative">
        <div className="w-24 h-24 bg-wood-dark border-4 border-wood-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-orange/30 to-transparent animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin">
              <Zap className="w-12 h-12 text-accent-yellow" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h3 className="font-pixel text-2xl text-wood-dark mb-2">
          {isSearching ? "SEARCHING FOR PLAYER 2..." : "READY TO CONNECT"}
        </h3>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-primary-orange text-parchment px-3 py-1 font-pixel text-xs border-2 border-wood-dark"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cute Animation */}
      <div className="text-5xl animate-bounce">🎮</div>
    </div>
  );
}

function PlaceholderContent({ mode, state, interests }: { mode: "text" | "video"; state: VideoDatingState; interests: string[] }) {
  const isSearching = state === 'searching';
  
  if (mode === "text" && (state === 'matched' || state === 'connected')) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8 bg-parchment">
        <div className="w-24 h-24 bg-accent-pink border-4 border-wood-dark flex items-center justify-center">
          <span className="font-pixel text-4xl text-parchment">?</span>
        </div>
        <h3 className="font-pixel text-2xl text-wood-dark">TEXT CHAT MODE</h3>
        <p className="text-wood-dark/70">You're chatting with a stranger</p>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-primary-orange text-parchment px-3 py-1 font-pixel text-xs border-2 border-wood-dark"
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
