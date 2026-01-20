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
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100]">
                <div className={`bg-linear-to-b from-neutral-900 to-neutral-950 rounded-3xl shadow-2xl border border-neutral-800 overflow-hidden ${isVideoCall && isConnected ? 'w-[640px] h-[480px]' : 'w-80 p-8'}`}>

                    {/* Video Call Layout - Split Screen */}
                    {isVideoCall && isConnected ? (
                        <div className="relative w-full h-full flex flex-row gap-1 p-1">
                            {/* Remote Video (left half) */}
                            <div className="flex-1 relative bg-neutral-800 rounded-xl overflow-hidden">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={`w-full h-full object-cover ${!remoteHasVideo ? 'opacity-0' : ''}`}
                                />

                                {/* Remote camera off placeholder */}
                                {!remoteHasVideo && (
                                    <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-2">
                                            <span className="text-2xl text-neutral-400">{callerName.slice(0, 1).toUpperCase()}</span>
                                        </div>
                                        <span className="text-xs text-neutral-500">Camera off</span>
                                    </div>
                                )}

                                {/* Caller Info Overlay */}
                                <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                        {callerName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-white text-xs font-medium">{callerName}</p>
                                        <p className="text-green-400 text-xs">{formatDuration(callDuration)}</p>
                                    </div>
                                </div>

                                {/* Partner label */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                                    Partner
                                </div>
                            </div>

                            {/* Local Video (right half) */}
                            <div className="flex-1 relative bg-neutral-800 rounded-xl overflow-hidden">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className={`w-full h-full object-cover ${isCameraOff ? 'opacity-0' : ''}`}
                                />

                                {/* Local camera off placeholder */}
                                {isCameraOff && (
                                    <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-neutral-700 flex items-center justify-center mb-2">
                                            {Icons.cameraOff}
                                        </div>
                                        <span className="text-xs text-neutral-500">Camera Off</span>
                                    </div>
                                )}

                                {/* You label */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                                    You
                                </div>
                            </div>

                            {/* Video Call Controls - Bottom Center */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
                                {/* Mute Button */}
                                <button
                                    onClick={onToggleMute}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${isMuted ? 'bg-red-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                                    title={isMuted ? "Unmute" : "Mute"}
                                >
                                    {isMuted ? Icons.micOff : Icons.micOn}
                                </button>

                                {/* Camera Toggle Button */}
                                <button
                                    onClick={onToggleCamera}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-105 ${isCameraOff ? 'bg-red-500 text-white' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                                >
                                    {isCameraOff ? Icons.cameraOff : Icons.cameraOn}
                                </button>

                                {/* End Call Button */}
                                <button
                                    onClick={onEndCall}
                                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
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
                                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ${callState === 'calling' || (isIncoming && !isConnected) ? 'animate-pulse' : ''}`}>
                                        {callerName.slice(0, 1).toUpperCase()}
                                    </div>
                                    {/* Calling Animation Rings */}
                                    {(callState === 'calling' || (isIncoming && !isConnected)) && (
                                        <>
                                            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
                                            <div className="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-50" style={{ animationDelay: '0.3s' }} />
                                        </>
                                    )}
                                </div>

                                {/* Name */}
                                <h2 className="text-xl font-semibold text-white mb-1">{callerName}</h2>

                                {/* Status */}
                                <p className="text-sm text-neutral-400">
                                    {isIncoming && !isConnected && `Incoming ${callType} call...`}
                                    {!isIncoming && callState === 'calling' && "Calling..."}
                                    {!isIncoming && callState === 'ringing' && "Ringing..."}
                                    {isConnected && (
                                        <span className="text-green-400 font-medium">
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
                                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                                            title="Decline"
                                        >
                                            {Icons.phoneEnd}
                                        </button>
                                        <button
                                            onClick={onAnswer}
                                            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95 animate-bounce"
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
                                            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isMuted ? 'bg-neutral-700 text-red-400 hover:bg-neutral-600' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                                            title={isMuted ? "Unmute" : "Mute"}
                                        >
                                            {isMuted ? Icons.micOff : Icons.micOn}
                                        </button>

                                        {/* Camera Toggle (only for video calls) */}
                                        {isVideoCall && (
                                            <button
                                                onClick={onToggleCamera}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isCameraOff ? 'bg-neutral-700 text-red-400 hover:bg-neutral-600' : 'bg-neutral-700 text-white hover:bg-neutral-600'}`}
                                                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                                            >
                                                {isCameraOff ? Icons.cameraOff : Icons.cameraOn}
                                            </button>
                                        )}

                                        <button
                                            onClick={onEndCall}
                                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95"
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
                                        <div className="w-1 h-2 bg-green-400 rounded-full" />
                                        <div className="w-1 h-3 bg-green-400 rounded-full" />
                                        <div className="w-1 h-4 bg-green-400 rounded-full" />
                                        <div className="w-1 h-5 bg-green-400 rounded-full" />
                                    </div>
                                    <span className="text-xs text-neutral-500">Good connection</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

