'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Video, VideoOff, Mic, MicOff, SkipForward, Flag, X, Users, Heart, BookOpen, UserPlus, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoDating } from '@/hooks/useVideoDating';
import { BlindDateOverlay } from '@/components/video-dating/BlindDateOverlay';
import { VillageHeader, WoodenFrame, PixelButton, CarvedTextarea } from '@/components/village';

type IntentMode = 'DATE' | 'STUDY' | 'FRIEND';
type GenderPref = 'male' | 'female' | 'all';

const intentModes = [
    { value: 'DATE' as IntentMode, label: 'Date', icon: Heart, color: 'text-accent-pink' },
    { value: 'STUDY' as IntentMode, label: 'Study', icon: BookOpen, color: 'text-accent-blue' },
    { value: 'FRIEND' as IntentMode, label: 'Friend', icon: UserPlus, color: 'text-landscape-green' },
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
        blindDate,
        requestNewTopic,
        requestReveal,
        acceptReveal,
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

    useEffect(() => {
        connect();
        return () => disconnect();
    }, []);

    const setLocalVideoRef = useCallback((videoEl: HTMLVideoElement | null) => {
        localVideoRef.current = videoEl;
        if (videoEl && localStream) {
            videoEl.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, withVideo, isCameraOff]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
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
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-primary-orange border-4 border-wood-dark flex items-center justify-center mb-6"
            >
                <Video className="w-12 h-12 text-parchment" />
            </motion.div>

            <h2 className="font-pixel text-3xl text-wood-dark mb-2">RANDOM VIDEO</h2>
            <p className="text-wood-dark/70 text-center mb-8 max-w-xs">
                Meet new adventurers through random video calls. Choose your quest type below.
            </p>

            {/* Intent Mode Selection */}
            <div className="w-full max-w-sm mb-6">
                <label className="font-pixel text-sm text-wood-dark mb-3 block">LOOKING FOR</label>
                <div className="grid grid-cols-3 gap-3">
                    {intentModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <motion.button
                                key={mode.value}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIntentMode(mode.value)}
                                className={`p-4 border-3 transition-all flex flex-col items-center gap-2 ${
                                    intentMode === mode.value
                                        ? 'border-primary-orange bg-primary-orange/10'
                                        : 'border-wood-dark bg-parchment hover:bg-cork/30'
                                }`}
                            >
                                <Icon className={`w-6 h-6 ${mode.color}`} />
                                <span className="font-pixel text-sm text-wood-dark">{mode.label}</span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Gender Preference */}
            <div className="w-full max-w-sm mb-6">
                <label className="font-pixel text-sm text-wood-dark mb-3 block">MATCH WITH</label>
                <div className="flex gap-2 bg-cork/30 p-2 border-2 border-wood-dark">
                    {genderOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setGenderPref(opt.value)}
                            className={`flex-1 py-2.5 px-4 font-pixel text-sm transition-all ${
                                genderPref === opt.value
                                    ? 'bg-primary-orange text-parchment'
                                    : 'text-wood-dark hover:bg-parchment'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Camera Toggle */}
            <div className="w-full max-w-sm mb-6">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEnableCamera(!enableCamera)}
                    className={`w-full py-4 px-6 border-3 transition-all flex items-center justify-center gap-3 ${
                        enableCamera
                            ? 'border-landscape-green bg-landscape-green/10 text-wood-dark'
                            : 'border-primary-red bg-primary-red/10 text-wood-dark'
                    }`}
                >
                    {enableCamera ? (
                        <>
                            <Video className="w-5 h-5 text-landscape-green" />
                            <span className="font-pixel">CAMERA ON</span>
                        </>
                    ) : (
                        <>
                            <VideoOff className="w-5 h-5 text-primary-red" />
                            <span className="font-pixel">AUDIO ONLY</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Queue Info */}
            <div className="flex items-center gap-2 text-wood-dark mb-6">
                <Users className="w-5 h-5 text-primary-orange" />
                <span className="font-pixel text-sm">{queueSize} ONLINE</span>
            </div>

            {/* Start Button */}
            <PixelButton
                variant="primary"
                size="lg"
                className="w-full max-w-sm"
                onClick={handleStartMatching}
            >
                <Video className="w-5 h-5" />
                START MATCHING
            </PixelButton>

            {error && (
                <p className="text-primary-red font-pixel text-sm mt-4">{error}</p>
            )}
        </div>
    );

    const renderSearchingState = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="relative w-28 h-28 mb-6">
                <div className="absolute inset-0 border-4 border-cork" />
                <div className="absolute inset-0 border-4 border-t-primary-orange animate-spin" />
                <div className="absolute inset-4 bg-parchment flex items-center justify-center">
                    <Video className="w-10 h-10 text-primary-orange" />
                </div>
            </div>

            <h2 className="font-pixel text-xl text-wood-dark mb-2">SEARCHING...</h2>
            <p className="text-wood-dark/70 mb-8">
                Looking for {intentMode.toLowerCase()} partners
            </p>

            <PixelButton variant="secondary" onClick={leaveQueue}>
                CANCEL
            </PixelButton>
        </div>
    );

    const renderVideoCall = () => (
        <div className="h-full flex flex-col overflow-hidden relative">
            {blindDate && (
                <BlindDateOverlay
                    blindDate={blindDate}
                    onRequestTopic={requestNewTopic}
                    onRequestReveal={requestReveal}
                    onAcceptReveal={acceptReveal}
                />
            )}

            {/* Split Screen Video Container */}
            <div className="flex-1 min-h-0 flex flex-row gap-3">
                {/* Remote Video */}
                <div className="flex-1 min-h-0 relative bg-wood-dark border-4 border-wood-dark overflow-hidden">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover transition-all duration-1000 ${!remoteHasVideo ? 'opacity-0' : ''}`}
                        style={{
                            filter: blindDate ? `blur(${blindDate.blurLevel}px)` : 'none',
                        }}
                    />

                    {!remoteHasVideo && (
                        <div className="absolute inset-0 bg-parchment flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-cork border-4 border-wood-dark flex items-center justify-center mb-3">
                                <User className="w-10 h-10 text-wood-dark" />
                            </div>
                            <div className="flex items-center gap-2 text-wood-dark/70">
                                <VideoOff className="w-4 h-4" />
                                <span className="font-pixel text-sm">CAMERA OFF</span>
                            </div>
                        </div>
                    )}

                    {state === 'matched' && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-accent-yellow border-2 border-wood-dark font-pixel text-sm text-wood-dark">
                            CONNECTING...
                        </div>
                    )}
                    {state === 'connected' && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-landscape-green border-2 border-wood-dark font-pixel text-sm text-parchment flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-parchment animate-pulse" />
                            CONNECTED
                        </div>
                    )}

                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-wood-dark/80 font-pixel text-sm text-parchment">
                        PARTNER
                    </div>
                </div>

                {/* Local Video */}
                <div className="flex-1 min-h-0 relative bg-wood-dark border-4 border-wood-dark overflow-hidden">
                    <video
                        ref={setLocalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${(!withVideo || isCameraOff) ? 'opacity-0' : ''}`}
                    />

                    {(!withVideo || isCameraOff) && (
                        <div className="absolute inset-0 bg-parchment flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-cork border-4 border-wood-dark flex items-center justify-center mb-3">
                                <User className="w-10 h-10 text-wood-dark" />
                            </div>
                            <div className="flex items-center gap-2 text-wood-dark/70">
                                <VideoOff className="w-4 h-4" />
                                <span className="font-pixel text-sm">CAMERA OFF</span>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-wood-dark/80 font-pixel text-sm text-parchment">
                        YOU
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="shrink-0 p-4 flex items-center justify-center gap-3 bg-parchment border-t-3 border-wood-dark">
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleMute}
                    className={`w-14 h-14 border-3 border-wood-dark flex items-center justify-center transition-colors ${
                        isMuted ? 'bg-primary-red text-parchment' : 'bg-parchment text-wood-dark hover:bg-cork'
                    }`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleCamera}
                    className={`w-14 h-14 border-3 border-wood-dark flex items-center justify-center transition-colors ${
                        isCameraOff ? 'bg-primary-red text-parchment' : 'bg-parchment text-wood-dark hover:bg-cork'
                    }`}
                >
                    {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={nextPartner}
                    className="w-14 h-14 bg-accent-blue border-3 border-wood-dark flex items-center justify-center text-parchment hover:bg-accent-blue/80 transition-colors"
                    title="Next Partner"
                >
                    <SkipForward className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowReportModal(true)}
                    className="w-14 h-14 bg-accent-yellow border-3 border-wood-dark flex items-center justify-center text-wood-dark hover:bg-accent-yellow/80 transition-colors"
                    title="Report"
                >
                    <Flag className="w-6 h-6" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={endCall}
                    className="w-14 h-14 bg-primary-red border-3 border-wood-dark flex items-center justify-center text-parchment hover:bg-primary-red/80 transition-colors"
                    title="End Call"
                >
                    <X className="w-6 h-6" />
                </motion.button>
            </div>
        </div>
    );

    const renderEndedState = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 bg-cork border-4 border-wood-dark flex items-center justify-center mb-6">
                <Video className="w-10 h-10 text-wood-dark" />
            </div>
            <h2 className="font-pixel text-xl text-wood-dark mb-2">CALL ENDED</h2>
            <p className="text-wood-dark/70 mb-8">Your partner disconnected</p>

            <div className="flex gap-4">
                <PixelButton
                    variant="primary"
                    onClick={() => joinQueue(intentMode, genderPref)}
                >
                    FIND NEW PARTNER
                </PixelButton>
                <PixelButton
                    variant="secondary"
                    onClick={() => router.back()}
                >
                    EXIT
                </PixelButton>
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
        <div className="h-screen grass-dots flex flex-col overflow-hidden">
            <VillageHeader
                title="PEERZEE"
                subtitle="VIDEO TAVERN • RANDOM CHAT"
                showBack
                onBack={() => router.back()}
            />

            <main className={`flex-1 min-h-0 w-full ${
                (state === 'matched' || state === 'connected')
                    ? 'p-3'
                    : 'max-w-lg mx-auto p-6 overflow-auto'
            }`}>
                {(state === 'idle' || state === 'connecting' || state === 'searching' || state === 'ended') ? (
                    <WoodenFrame className="h-full">
                        {renderContent()}
                    </WoodenFrame>
                ) : (
                    <WoodenFrame className="h-full p-0">
                        {renderContent()}
                    </WoodenFrame>
                )}
            </main>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowReportModal(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative bg-parchment border-4 border-wood-dark p-6 max-w-sm w-full mx-4"
                    >
                        <h3 className="font-pixel text-xl text-wood-dark mb-4">REPORT USER</h3>
                        <CarvedTextarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Please describe the issue..."
                            rows={4}
                        />
                        <div className="flex gap-3 mt-6">
                            <PixelButton
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowReportModal(false)}
                            >
                                CANCEL
                            </PixelButton>
                            <PixelButton
                                variant="danger"
                                className="flex-1"
                                onClick={handleReport}
                                disabled={!reportReason.trim()}
                            >
                                REPORT
                            </PixelButton>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
