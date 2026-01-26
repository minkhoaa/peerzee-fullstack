'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Video, VideoOff, Mic, MicOff, SkipForward, Flag, X, Users, Heart, BookOpen, UserPlus, User } from 'lucide-react';
import { useVideoDating, VideoDatingState } from '@/hooks/useVideoDating';
import { BlindDateOverlay } from '@/components/video-dating/BlindDateOverlay';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

const intentModes = [
    { value: 'DATE' as IntentMode, label: 'Date', icon: Heart, color: 'text-pink-400' },
    { value: 'STUDY' as IntentMode, label: 'Study Buddy', icon: BookOpen, color: 'text-blue-400' },
    { value: 'FRIEND' as IntentMode, label: 'Friends', icon: UserPlus, color: 'text-green-400' },
];

const genderOptions = [
    { value: 'all' as GenderPref, label: 'Everyone' },
    { value: 'male' as GenderPref, label: 'Male' },
    { value: 'female' as GenderPref, label: 'Female' },
];

export default function VideoDatingPage() {
    const router = useRouter();
    const {
        state,
        error,
        remoteStream,
        remoteHasVideo,
        queueSize,
        withVideo,
        localStream,
        // 🎬 AI DATING HOST: Blind Date features
        blindDate,
        requestNewTopic,
        reportActivity,
        requestReveal,
        acceptReveal,
        // Core actions
        connect,
        disconnect,
        joinQueue,
        leaveQueue,
        nextPartner,
        endCall,
        reportPartner,
    } = useVideoDating();

    const [intentMode, setIntentMode] = useState<IntentMode>('DATE');
    const [genderPref, setGenderPref] = useState<GenderPref>('all');
    const [enableCamera, setEnableCamera] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Connect on mount - only once
    useEffect(() => {
        connect();
        return () => disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ref callback to set srcObject immediately when video element mounts
    const setLocalVideoRef = useCallback((videoEl: HTMLVideoElement | null) => {
        localVideoRef.current = videoEl;
        if (videoEl && localStream) {
            videoEl.srcObject = localStream;
        }
    }, [localStream]);

    // Also update when localStream changes (for already mounted elements)
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            console.log('[Video] Local stream set, tracks:', localStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            console.log('[Video] withVideo:', withVideo, 'isCameraOff:', isCameraOff);
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, withVideo, isCameraOff]);

    // Update remote video
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            console.log('[Video] Remote stream set, tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
            console.log('[Video] remoteHasVideo:', remoteHasVideo);
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, remoteHasVideo]);

    const handleStartMatching = () => {
        joinQueue(intentMode, genderPref, enableCamera);
        setIsCameraOff(!enableCamera);
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

    const renderIdleState = () => (
        <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-20 h-20 rounded-full bg-[#2F2F2F] flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-[#9B9A97]" />
            </div>

            <h2 className="text-xl font-semibold text-[#E3E3E3] mb-2">Random Video Chat</h2>
            <p className="text-[#9B9A97] text-sm text-center mb-8 max-w-xs">
                Meet new people through random video calls. Choose your intent and preferences below.
            </p>

            {/* Intent Mode Selection */}
            <div className="w-full max-w-sm mb-6">
                <label className="text-xs text-[#9B9A97] uppercase tracking-wider mb-3 block">Looking for</label>
                <div className="grid grid-cols-3 gap-2">
                    {intentModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <button
                                key={mode.value}
                                onClick={() => setIntentMode(mode.value)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${intentMode === mode.value
                                    ? 'border-[#E3E3E3] bg-[#2F2F2F]'
                                    : 'border-[#3A3A3A] bg-[#252525] hover:bg-[#2A2A2A]'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${mode.color}`} />
                                <span className="text-xs text-[#E3E3E3]">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Gender Preference */}
            <div className="w-full max-w-sm mb-6">
                <label className="text-xs text-[#9B9A97] uppercase tracking-wider mb-3 block">Match with</label>
                <div className="flex gap-2">
                    {genderOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setGenderPref(opt.value)}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm transition-all ${genderPref === opt.value
                                ? 'bg-[#E3E3E3] text-[#191919]'
                                : 'bg-[#2F2F2F] text-[#9B9A97] hover:bg-[#3A3A3A]'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Camera Toggle */}
            <div className="w-full max-w-sm mb-6">
                <button
                    onClick={() => setEnableCamera(!enableCamera)}
                    className={`w-full py-3 px-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${enableCamera
                        ? 'border-[#3A3A3A] bg-[#252525] text-[#E3E3E3]'
                        : 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        }`}
                >
                    {enableCamera ? (
                        <>
                            <Video className="w-5 h-5" />
                            <span className="text-sm">Camera enabled</span>
                        </>
                    ) : (
                        <>
                            <VideoOff className="w-5 h-5" />
                            <span className="text-sm">Audio only (camera off)</span>
                        </>
                    )}
                </button>
                <p className="text-xs text-[#9B9A97] text-center mt-2">
                    {enableCamera ? "You'll join with camera on" : "You'll join with audio only"}
                </p>
            </div>

            {/* Queue Info */}
            <div className="flex items-center gap-2 text-[#9B9A97] text-sm mb-6">
                <Users className="w-4 h-4" />
                <span>{queueSize} people online</span>
            </div>

            {/* Start Button */}
            <button
                onClick={handleStartMatching}
                className="w-full max-w-sm py-4 bg-[#E3E3E3] hover:bg-white text-[#191919] rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
                <Video className="w-5 h-5" />
                Start Matching
            </button>

            {error && (
                <p className="text-red-400 text-sm mt-4">{error}</p>
            )}
        </div>
    );

    const renderSearchingState = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-[#3A3A3A]" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#E3E3E3] animate-spin" />
                <div className="absolute inset-3 rounded-full bg-[#2F2F2F] flex items-center justify-center">
                    <Video className="w-8 h-8 text-[#9B9A97]" />
                </div>
            </div>

            <h2 className="text-lg font-medium text-[#E3E3E3] mb-2">Finding someone...</h2>
            <p className="text-[#9B9A97] text-sm mb-8">
                Looking for {intentMode.toLowerCase()} partners
            </p>

            <button
                onClick={leaveQueue}
                className="px-6 py-2.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-lg transition-colors"
            >
                Cancel
            </button>
        </div>
    );

    const renderVideoCall = () => (
        <div className="h-full flex flex-col overflow-hidden relative">
            {/* 🎬 AI DATING HOST: Blind Date Overlay */}
            {blindDate && (
                <BlindDateOverlay
                    blindDate={blindDate}
                    onRequestTopic={requestNewTopic}
                    onRequestReveal={requestReveal}
                    onAcceptReveal={acceptReveal}
                />
            )}

            {/* Split Screen Video Container - horizontal */}
            <div className="flex-1 min-h-0 flex flex-row gap-2">
                {/* Remote Video (left half) */}
                <div className="flex-1 min-h-0 relative bg-black rounded-xl overflow-hidden">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-all duration-1000 ${!remoteHasVideo ? 'opacity-0' : ''}`}
                        style={{
                            // 🎬 AI DATING HOST: Dynamic blur effect
                            filter: blindDate ? `blur(${blindDate.blurLevel}px)` : 'none',
                        }}
                    />

                    {/* Remote camera off placeholder */}
                    {!remoteHasVideo && (
                        <div className="absolute inset-0 bg-[#252525] flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-[#3A3A3A] flex items-center justify-center mb-2">
                                <User className="w-8 h-8 text-[#9B9A97]" />
                            </div>
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <VideoOff className="w-4 h-4" />
                                <span className="text-xs">Partner camera off</span>
                            </div>
                        </div>
                    )}

                    {/* Status indicator */}
                    {state === 'matched' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[#2F2F2F]/80 backdrop-blur-sm rounded-full text-xs text-[#E3E3E3]">
                            Connecting...
                        </div>
                    )}
                    {state === 'connected' && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 backdrop-blur-sm rounded-full text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Connected
                        </div>
                    )}

                    {/* Partner label */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                        Partner
                    </div>
                </div>

                {/* Local Video (right half) */}
                <div className="flex-1 min-h-0 relative bg-black rounded-xl overflow-hidden">
                    <video
                        ref={setLocalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                    />

                    {/* Local camera off placeholder */}
                    {(!withVideo || isCameraOff) && (
                        <div className="absolute inset-0 bg-[#252525] flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-[#3A3A3A] flex items-center justify-center mb-2">
                                <User className="w-8 h-8 text-[#9B9A97]" />
                            </div>
                            <div className="flex items-center gap-2 text-[#9B9A97]">
                                <VideoOff className="w-4 h-4" />
                                <span className="text-xs">Camera off</span>
                            </div>
                        </div>
                    )}

                    {/* You label */}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs text-white">
                        You
                    </div>
                </div>
            </div>

            {/* Controls - fixed at bottom */}
            <div className="shrink-0 p-2 flex items-center justify-center gap-2">
                <button
                    onClick={handleToggleMute}
                    className={`p-3 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#2F2F2F] text-[#E3E3E3] hover:bg-[#3A3A3A]'
                        }`}
                >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                    onClick={handleToggleCamera}
                    className={`p-3 rounded-full transition-colors ${isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-[#2F2F2F] text-[#E3E3E3] hover:bg-[#3A3A3A]'
                        }`}
                >
                    {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                <button
                    onClick={nextPartner}
                    className="p-3 bg-[#2F2F2F] text-[#E3E3E3] hover:bg-[#3A3A3A] rounded-full transition-colors"
                    title="Next Partner"
                >
                    <SkipForward className="w-4 h-4" />
                </button>

                <button
                    onClick={() => setShowReportModal(true)}
                    className="p-3 bg-[#2F2F2F] text-yellow-400 hover:bg-yellow-500/20 rounded-full transition-colors"
                    title="Report"
                >
                    <Flag className="w-4 h-4" />
                </button>

                <button
                    onClick={endCall}
                    className="p-3 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors"
                    title="End Call"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );

    const renderEndedState = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-[#2F2F2F] flex items-center justify-center mb-4">
                <Video className="w-8 h-8 text-[#9B9A97]" />
            </div>
            <h2 className="text-lg font-medium text-[#E3E3E3] mb-2">Call Ended</h2>
            <p className="text-[#9B9A97] text-sm mb-6">Your partner disconnected</p>

            <div className="flex gap-3">
                <button
                    onClick={() => joinQueue(intentMode, genderPref)}
                    className="px-6 py-2.5 bg-[#E3E3E3] text-[#191919] rounded-lg font-medium hover:bg-white transition-colors"
                >
                    Find New Partner
                </button>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-2.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-lg transition-colors"
                >
                    Exit
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (state) {
            case 'idle':
            case 'connecting':
                return renderIdleState();
            case 'searching':
                return renderSearchingState();
            case 'matched':
            case 'connected':
                return renderVideoCall();
            case 'ended':
                return renderEndedState();
            default:
                return renderIdleState();
        }
    };

    return (
        <div className="h-screen bg-[#191919] flex flex-col overflow-hidden">
            {/* Header */}
            <header className="shrink-0 bg-[#191919] border-b border-[#2F2F2F] px-4 h-14 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-[#9B9A97] hover:text-[#E3E3E3] rounded-lg hover:bg-[#202020] transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-semibold text-[#E3E3E3]">Video Chat</h1>
                <div className="w-9" /> {/* Spacer */}
            </header>

            {/* Main Content - full screen for video call */}
            <main className={`flex-1 min-h-0 w-full ${(state === 'matched' || state === 'connected')
                ? 'p-2'
                : 'max-w-lg mx-auto p-4 overflow-auto'
                }`}>
                {renderContent()}
            </main>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed  inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowReportModal(false)} />
                    <div className="relative bg-[#202020] border border-[#2F2F2F] rounded-xl p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-medium text-[#E3E3E3] mb-4">Report User</h3>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Please describe the issue..."
                            className="w-full px-4 py-3 bg-[#2F2F2F] border border-[#3A3A3A] rounded-lg text-[#E3E3E3] placeholder-[#9B9A97] resize-none focus:outline-none focus:border-[#E3E3E3]"
                            rows={4}
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 py-2.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={!reportReason.trim()}
                                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
