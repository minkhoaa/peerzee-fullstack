"use client";

import React, { useEffect, useState, useRef, RefObject, MutableRefObject } from "react";

interface CallModalProps {
    callState: 'idle' | 'calling' | 'ringing' | 'connected';
    callType: 'audio' | 'video';
    callerName?: string;
    isMuted: boolean;
    isCameraOff: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onEndCall: () => void;
    onAnswer?: () => void;
    onDecline?: () => void;
    isIncoming?: boolean;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
    localStreamRef: MutableRefObject<MediaStream | null>;
    remoteStream: MediaStream | null;
    remoteHasVideo?: boolean;
    withVideo?: boolean; // Whether local camera is actually available/enabled
}

// Icons
const Icons = {
    phone: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    phoneEnd: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
        </svg>
    ),
    micOn: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    ),
    micOff: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
    ),
    cameraOn: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    ),
    cameraOff: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
    ),
};

export default function CallModal({
    callState,
    callType,
    callerName = "Unknown",
    isMuted,
    isCameraOff,
    onToggleMute,
    onToggleCamera,
    onEndCall,
    onAnswer,
    onDecline,
    isIncoming = false,
    remoteAudioRef,
    localStreamRef,
    remoteStream,
    remoteHasVideo = false,
    withVideo = false,
}: CallModalProps) {
    const [callDuration, setCallDuration] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (callState === 'connected') {
            setCallDuration(0);
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setCallDuration(0);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [callState]);

    // Attach local stream to local video element
    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current && callType === 'video') {
            console.log('[CallModal] Attaching local stream to video');
            localVideoRef.current.srcObject = localStreamRef.current;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [callType, callState]);

    // Attach remote stream to remote video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream && callType === 'video') {
            console.log('[CallModal] Attaching remote stream to video');
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, callType, callState]);


    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (callState === 'idle' && !isIncoming) return null;

    const isVideoCall = callType === 'video';
    const isConnected = callState === 'connected';

    return (
        <>
            {/* Hidden audio element for remote audio playback */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Modal Overlay */}
            <div className="fixed inset-0 bg-cocoa/80 flex items-center justify-center z-[100]">
                <div className={`bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg overflow-hidden ${isVideoCall && isConnected ? 'w-[640px] h-[480px]' : 'w-80 p-8'}`}>

                    {/* Video Call Layout - Split Screen */}
                    {isVideoCall && isConnected ? (
                        <div className="relative w-full h-full flex flex-row gap-1 p-1">
                            {/* Remote Video (left half) */}
                            <div className="flex-1 relative bg-retro-paper border-2 border-cocoa rounded-xl overflow-hidden">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover ${!remoteHasVideo ? 'opacity-0' : ''}`}
                                />

                                {/* Remote camera off placeholder */}
                                {!remoteHasVideo && (
                                    <div className="absolute inset-0 bg-retro-paper flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-xl bg-pixel-pink border-2 border-cocoa flex items-center justify-center mb-2">
                                            <span className="text-2xl text-cocoa font-pixel">{callerName.slice(0, 1).toUpperCase()}</span>
                                        </div>
                                        <span className="text-xs text-cocoa-light font-bold">Camera off</span>
                                    </div>
                                )}

                                {/* Caller Info Overlay */}
                                <div className="absolute top-2 left-2 flex items-center gap-2 bg-retro-white/90 border-2 border-cocoa rounded-lg px-3 py-1.5">
                                    <div className="w-6 h-6 rounded-lg bg-pixel-blue border border-cocoa flex items-center justify-center text-cocoa text-xs font-pixel">
                                        {callerName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-cocoa text-xs font-bold">{callerName}</p>
                                        <p className="text-pixel-green text-xs font-pixel">{formatDuration(callDuration)}</p>
                                    </div>
                                </div>

                                {/* Partner label */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-pixel-purple/90 border border-cocoa rounded-lg text-xs text-cocoa font-bold">
                                    Partner
                                </div>
                            </div>

                            {/* Local Video (right half) */}
                            <div className="flex-1 relative bg-retro-paper border-2 border-cocoa rounded-xl overflow-hidden">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                                />

                                {/* Local camera off placeholder */}
                                {(!withVideo || isCameraOff) && (
                                    <div className="absolute inset-0 bg-retro-paper flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-xl bg-cocoa/20 border-2 border-cocoa flex items-center justify-center mb-2 text-cocoa">
                                            {Icons.cameraOff}
                                        </div>
                                        <span className="text-xs text-cocoa-light font-bold">Camera Off</span>
                                    </div>
                                )}

                                {/* You label */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-pixel-blue/90 border border-cocoa rounded-lg text-xs text-cocoa font-bold">
                                    You
                                </div>
                            </div>

                            {/* Video Call Controls - Bottom Center */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-retro-white/90 border-2 border-cocoa rounded-xl px-4 py-2 shadow-pixel">
                                {/* Mute Button */}
                                <button
                                    onClick={onToggleMute}
                                    className={`w-10 h-10 rounded-lg border-2 border-cocoa flex items-center justify-center transition-all hover:translate-y-0.5 ${isMuted ? 'bg-pixel-red text-cocoa' : 'bg-pixel-green text-cocoa'}`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? Icons.micOff : Icons.micOn}
                                </button>

                                {/* Camera Toggle Button */}
                                <button
                                    onClick={onToggleCamera}
                                    className={`w-10 h-10 rounded-lg border-2 border-cocoa flex items-center justify-center transition-all hover:translate-y-0.5 ${isCameraOff ? 'bg-pixel-red text-cocoa' : 'bg-pixel-blue text-cocoa'}`}
                                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                                >
                                    {isCameraOff ? Icons.cameraOff : Icons.cameraOn}
                                </button>

                                {/* End Call Button */}
                                <button
                                    onClick={onEndCall}
                                    className="w-12 h-12 rounded-lg bg-pixel-red border-2 border-cocoa flex items-center justify-center text-cocoa shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all"
                                    title="End Call"
                                >
                                    {Icons.phoneEnd}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Audio Call / Waiting Layout */
                        <>
                            {/* Avatar */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative mb-4">
                                    <div className={`w-24 h-24 rounded-xl bg-pixel-pink border-3 border-cocoa flex items-center justify-center text-cocoa text-3xl font-pixel shadow-pixel ${callState === 'calling' || (isIncoming && !isConnected) ? 'animate-pulse' : ''}`}>
                                        {callerName.slice(0, 1).toUpperCase()}
                                    </div>
                                    {/* Calling Animation Rings */}
                                    {(callState === 'calling' || (isIncoming && !isConnected)) && (
                                        <>
                                            <div className="absolute inset-0 rounded-xl border-2 border-pixel-blue animate-ping opacity-75" />
                                            <div className="absolute inset-0 rounded-xl border-2 border-pixel-purple animate-ping opacity-50" style={{ animationDelay: '0.3s' }} />
                                        </>
                                    )}
                                </div>

                                {/* Name */}
                                <h2 className="text-xl font-pixel uppercase tracking-widest text-cocoa mb-1">{callerName}</h2>

                                {/* Status */}
                                <p className="text-sm text-cocoa-light font-bold">
                                    {isIncoming && !isConnected && `Incoming ${callType} call...`}
                                    {!isIncoming && callState === 'calling' && "Calling..."}
                                    {!isIncoming && callState === 'ringing' && "Ringing..."}
                                    {isConnected && (
                                        <span className="text-pixel-green font-pixel">
                                            {formatDuration(callDuration)}
                                        </span>
                                    )}
                                </p>
                            </div>

                            {/* Call Controls */}
                            <div className="flex items-center justify-center gap-6">
                                {/* Incoming Call Controls */}
                                {isIncoming && !isConnected && (
                                    <>
                                        <button
                                            onClick={onDecline}
                                            className="w-16 h-16 rounded-xl bg-pixel-red border-3 border-cocoa flex items-center justify-center text-cocoa shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
                                            title="Decline"
                                        >
                                            {Icons.phoneEnd}
                                        </button>
                                        <button
                                            onClick={onAnswer}
                                            className="w-16 h-16 rounded-xl bg-pixel-green border-3 border-cocoa flex items-center justify-center text-cocoa shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all animate-bounce"
                                            title="Answer"
                                        >
                                            {Icons.phone}
                                        </button>
                                    </>
                                )}

                                {/* Outgoing Call / Connected Controls */}
                                {(!isIncoming || isConnected) && (
                                    <>
                                        <button
                                            onClick={onToggleMute}
                                            className={`w-14 h-14 rounded-xl border-2 border-cocoa flex items-center justify-center shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all ${isMuted ? 'bg-pixel-red text-cocoa' : 'bg-pixel-blue text-cocoa'}`}
                                            title={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? Icons.micOff : Icons.micOn}
                                        </button>

                                        {/* Camera Toggle (only for video calls) */}
                                        {isVideoCall && (
                                            <button
                                                onClick={onToggleCamera}
                                                className={`w-14 h-14 rounded-xl border-2 border-cocoa flex items-center justify-center shadow-pixel-sm hover:translate-y-0.5 hover:shadow-none transition-all ${isCameraOff ? 'bg-pixel-red text-cocoa' : 'bg-pixel-purple text-cocoa'}`}
                                                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                                            >
                                                {isCameraOff ? Icons.cameraOff : Icons.cameraOn}
                                            </button>
                                        )}

                                        <button
                                            onClick={onEndCall}
                                            className="w-16 h-16 rounded-xl bg-pixel-red border-3 border-cocoa flex items-center justify-center text-cocoa shadow-pixel hover:translate-y-0.5 hover:shadow-pixel-sm transition-all"
                                            title="End Call"
                                        >
                                            {Icons.phoneEnd}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Connection Quality Indicator */}
                            {isConnected && (
                                <div className="mt-6 flex items-center justify-center gap-2">
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-2 bg-pixel-green rounded-sm" />
                                        <div className="w-1 h-3 bg-pixel-green rounded-sm" />
                                        <div className="w-1 h-4 bg-pixel-green rounded-sm" />
                                        <div className="w-1 h-5 bg-pixel-green rounded-sm" />
                                    </div>
                                    <span className="text-xs text-cocoa-light font-bold">Good connection</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

