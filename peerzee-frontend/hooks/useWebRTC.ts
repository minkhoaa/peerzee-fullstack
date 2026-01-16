import { useRef, useState, type MutableRefObject } from "react";
import { Socket } from "socket.io-client";


export function useWebRTC(socketRef: MutableRefObject<Socket | null>) {
    const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected'>("idle");
    const [activeCallConversationId, setActiveCallConversationId] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const remoteAudio = useRef<HTMLAudioElement | null>(null);

    const config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    };
    const startCall = async (conversation_id: string, withVideo: boolean = false) => {
        const socket = socketRef.current;
        if (!socket) return;
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: withVideo
            });
            peerConnection.current = new RTCPeerConnection(config);
            localStream.current.getTracks().forEach(track => peerConnection.current?.addTrack(track, localStream.current!));

            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:ice-candidate", {
                        conversation_id,
                        candidate: event.candidate,
                    });
                }
            }
            peerConnection.current.ontrack = (event) => {
                console.log('[WebRTC] ontrack received:', event.streams);
                const stream = event.streams[0];
                setRemoteStream(stream);
                if (remoteAudio.current) {
                    remoteAudio.current.srcObject = stream;
                    remoteAudio.current.play().catch(console.error);
                }
            }
            const offer = await peerConnection.current.createOffer();
            await peerConnection.current.setLocalDescription(offer);
            socket.emit("call:offer", {
                conversation_id,
                offer,
            });
            setActiveCallConversationId(conversation_id);
            setCallState("calling");
        } catch (error) {
            console.error("Error starting call:", error);
        }
    }
    const answerCall = async (conversation_id: string, offer: RTCSessionDescriptionInit, withVideo: boolean = false) => {
        const socket = socketRef.current;
        if (!socket) return;
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            peerConnection.current = new RTCPeerConnection(config);
            localStream.current.getTracks().forEach(track => {
                peerConnection.current?.addTrack(track, localStream.current!);
            })
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:ice-candidate", {
                        conversation_id,
                        candidate: event.candidate,
                    });
                }
            }
            peerConnection.current.ontrack = event => {
                console.log('[WebRTC] ontrack received:', event.streams);
                const stream = event.streams[0];
                setRemoteStream(stream);
                if (remoteAudio.current) {
                    remoteAudio.current.srcObject = stream;
                    remoteAudio.current.play().catch(console.error);
                }
            }
            await peerConnection.current.setRemoteDescription(offer);
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.emit('call:answer', { conversation_id, answer });
            setActiveCallConversationId(conversation_id);
            setCallState("connected");
        } catch (error) {
            console.error("Error answering call:", error);
        }
    }
    const endCall = () => {
        const socket = socketRef.current;
        if (socket && activeCallConversationId)
            socket.emit('call:end', { conversation_id: activeCallConversationId })
        peerConnection.current?.close();
        localStream.current?.getTracks().forEach(track => track.stop());
        peerConnection.current = null;
        localStream.current = null;
        setRemoteStream(null);

        setActiveCallConversationId(null);
        setCallState("idle");
    }
    const toggleMute = () => {
        if (!localStream.current) return;
        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            return !audioTrack.enabled;
        }
        return false;
    }
    const toggleCamera = () => {
        if (!localStream.current) return;
        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            return !videoTrack.enabled;
        }
        return false;
    }
    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
        if (peerConnection.current) {
            await peerConnection.current.setRemoteDescription(answer);
            setCallState("connected");
        }
    }
    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
        if (peerConnection.current) {
            await peerConnection.current.addIceCandidate(candidate);
        }
    }

    return {
        callState,
        activeCallConversationId,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleCamera,
        localStream,
        remoteStream,
        handleAnswer,
        handleIceCandidate,
        remoteAudio
    };

}