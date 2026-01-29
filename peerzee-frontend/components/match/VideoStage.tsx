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
    <div className="flex-[2] h-full bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel relative overflow-hidden flex flex-col">
      {/* Main Video Area */}
      <div className="flex-1 relative m-3 rounded-lg overflow-hidden bg-retro-bg border-2 border-cocoa">
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
                    <div className="absolute inset-0 bg-retro-bg flex flex-col items-center justify-center">
                      <div className="w-20 h-20 border-3 border-cocoa rounded-xl bg-pixel-purple flex items-center justify-center mb-3 shadow-pixel-sm">
                        <User className="w-10 h-10 text-cocoa" />
                      </div>
                      <div className="flex items-center gap-2 text-cocoa-light font-bold">
                        <VideoOff className="w-4 h-4" />
                        <span className="text-sm">Partner camera off</span>
                      </div>
                    </div>
                  )}
                  {/* Status indicator */}
                  {state === 'matched' && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-pixel-yellow border-2 border-cocoa rounded-lg text-xs text-cocoa font-pixel uppercase tracking-wider shadow-pixel-sm">
                      Connecting...
                    </div>
                  )}
                  {state === 'connected' && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-pixel-green border-2 border-cocoa rounded-lg text-xs text-cocoa font-pixel uppercase tracking-wider flex items-center gap-1.5 shadow-pixel-sm">
                      <span className="w-2 h-2 rounded bg-cocoa animate-pulse" />
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
              <div className="absolute bottom-3 left-3 w-28 h-40 bg-cocoa/20 border-2 border-cocoa rounded-lg shadow-pixel-sm overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                />
                {(!withVideo || isCameraOff) && (
                  <div className="absolute inset-0 bg-cocoa flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-2 border-retro-white rounded-lg bg-pixel-pink flex items-center justify-center mb-2">
                      <User className="w-5 h-5 text-cocoa" />
                    </div>
                    <div className="flex items-center gap-1.5 text-retro-white text-xs font-bold">
                      <VideoOff className="w-3 h-3" />
                      <span>Camera off</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-cocoa border border-retro-white rounded text-xs text-retro-white font-pixel">
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
      <div className="flex items-center justify-center pb-4 gap-2">
        {/* Mute Button */}
        {isConnected && (
          <>
            <button
              onClick={onToggleMute}
              className={`p-3 rounded-lg border-2 border-cocoa transition-all shadow-pixel-sm active:translate-y-0.5 active:shadow-none ${
                isMuted 
                  ? 'bg-pixel-red text-white' 
                  : 'bg-retro-white text-cocoa hover:bg-pixel-blue'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            {mode === "video" && (
              <button
                onClick={onToggleCamera}
                className={`p-3 rounded-lg border-2 border-cocoa transition-all shadow-pixel-sm active:translate-y-0.5 active:shadow-none ${
                  isCameraOff 
                    ? 'bg-pixel-red text-white' 
                    : 'bg-retro-white text-cocoa hover:bg-pixel-blue'
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
          className="bg-cocoa text-retro-white px-6 py-3 rounded-l-lg border-2 border-cocoa font-pixel uppercase tracking-widest hover:bg-cocoa-light transition-all shadow-pixel-sm flex items-center gap-2 active:translate-y-0.5 active:shadow-none"
        >
          <span className="text-xs">ESC</span>
          <span className="text-sm">STOP</span>
        </button>
        <button
          onClick={onNext}
          disabled={!isConnected}
          className="bg-pixel-pink text-cocoa px-8 py-3 rounded-r-lg border-2 border-cocoa font-pixel uppercase tracking-widest hover:bg-pixel-pink-dark transition-all shadow-pixel-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 active:translate-y-0.5 active:shadow-none"
        >
          <span className="text-base">NEXT</span>
          <span className="text-xs">ENTER</span>
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
        <div className="absolute inset-0 bg-pixel-pink/30 rounded-lg animate-ping" />
        <div className="relative bg-retro-white rounded-xl p-6 border-3 border-cocoa shadow-pixel">
          <Loader2 className="w-14 h-14 text-pixel-pink animate-spin" />
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <h3 className="text-cocoa text-xl font-pixel uppercase tracking-widest mb-2">
          {isSearching ? "Looking for a friend..." : "Ready to connect"}
        </h3>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-pixel-yellow text-cocoa px-3 py-1.5 rounded-lg border-2 border-cocoa text-sm font-bold shadow-pixel-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cute Animation */}
      <div className="text-5xl animate-bounce">🧸</div>
    </div>
  );
}

function PlaceholderContent({ mode, state, interests }: { mode: "text" | "video"; state: VideoDatingState; interests: string[] }) {
  const isSearching = state === 'searching';
  
  if (mode === "text" && (state === 'matched' || state === 'connected')) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
        <div className="bg-retro-white rounded-xl p-4 border-3 border-cocoa shadow-pixel">
          <div className="w-20 h-20 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa text-3xl font-pixel">
            ?
          </div>
        </div>
        <h3 className="text-cocoa text-2xl font-pixel uppercase tracking-widest">Text Chat Mode</h3>
        <p className="text-cocoa-light text-base font-bold">You're chatting with a stranger</p>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {interests.map((interest, idx) => (
              <span
                key={idx}
                className="bg-pixel-yellow text-cocoa px-3 py-1.5 rounded-lg border-2 border-cocoa text-sm font-bold shadow-pixel-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
        <div className="text-4xl">💬</div>
      </div>
    );
  }

  return <SearchingPlaceholder isSearching={isSearching} interests={interests} />;
}
