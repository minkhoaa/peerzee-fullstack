import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type VideoDatingState = 'idle' | 'connecting' | 'searching' | 'matched' | 'connected' | 'ended';

interface MatchInfo {
  sessionId: string;
  partnerId: string;
  isInitiator: boolean;
}

// 🎬 AI DATING HOST: Blind Date State
export interface BlindDateState {
  introMessage: string;
  currentTopic: string;
  blurLevel: number;
  topicNumber: number;
  isRescue: boolean;
  revealRequested: boolean;
}

export function useVideoDating() {
  const [state, setState] = useState<VideoDatingState>('idle');
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [withVideo, setWithVideo] = useState(true);

  // 🎬 AI DATING HOST: Blind Date state
  const [blindDate, setBlindDate] = useState<BlindDateState | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const cleanup = useCallback((cleanupStream = true) => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    if (cleanupStream && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setRemoteStream(null);
    setRemoteHasVideo(false);
    setMatchInfo(null);
    if (cleanupStream) {
      setLocalStream(null);
    }
  }, []);

  const setupPeerConnection = useCallback((socket: Socket, sessionId: string, isInitiator: boolean) => {
    console.log('[WebRTC] Setting up peer connection, isInitiator:', isInitiator);

    // Create peer connection
    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    // Debug connection state
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    // Add local tracks if we have them
    if (localStreamRef.current) {
      console.log('[WebRTC] Adding local tracks:', localStreamRef.current.getTracks().length);
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });

      // If we only have audio, we still need to receive video
      const hasVideoTrack = localStreamRef.current.getVideoTracks().length > 0;
      if (!hasVideoTrack) {
        console.log('[WebRTC] No local video track, adding recvonly transceiver for video');
        pc.addTransceiver('video', { direction: 'recvonly' });
      }
    } else {
      console.warn('[WebRTC] No local stream available, adding recvonly transceivers');
      // Add transceivers to receive media even without local stream
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
    }

    // Handle remote stream - use a ref to accumulate tracks
    const remoteStreamRef = { current: new MediaStream() };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track:', event.track.kind, 'enabled:', event.track.enabled);

      // Add track to our accumulated stream
      remoteStreamRef.current.addTrack(event.track);

      // Always update the remote stream state with accumulated tracks
      setRemoteStream(remoteStreamRef.current);

      // Check if this is a video track
      if (event.track.kind === 'video') {
        console.log('[WebRTC] Remote video track received, enabled:', event.track.enabled);
        setRemoteHasVideo(event.track.enabled);

        // Listen for track state changes
        event.track.onmute = () => {
          console.log('[WebRTC] Remote video muted');
          setRemoteHasVideo(false);
        };
        event.track.onunmute = () => {
          console.log('[WebRTC] Remote video unmuted');
          setRemoteHasVideo(true);
        };
        event.track.onended = () => {
          console.log('[WebRTC] Remote video track ended');
          setRemoteHasVideo(false);
        };
      }

      if (event.track.kind === 'audio') {
        console.log('[WebRTC] Remote audio track received, enabled:', event.track.enabled);
      }

      setState('connected');
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate');
        socket.emit('call:ice-candidate', {
          sessionId,
          candidate: event.candidate,
        });
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      console.log('[WebRTC] Creating offer...');
      pc.createOffer().then(offer => {
        console.log('[WebRTC] Offer created, setting local description');
        pc.setLocalDescription(offer);
        socket.emit('call:offer', {
          sessionId,
          offer,
        });
        console.log('[WebRTC] Offer sent to server');
      }).catch(err => {
        console.error('[WebRTC] Failed to create offer:', err);
      });
    }

    return pc;
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setState('connecting');

    const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
    console.log('[VideoDating] Connecting to:', `${baseUrl}/socket/video-dating`);

    const socket = io(`${baseUrl}/socket/video-dating`, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[VideoDating] Connected!');
      setState('idle');
      setError(null);
    });

    socket.on('connect_error', (err) => {
      console.error('[VideoDating] Connection error:', err.message);
      setError(`Connection failed: ${err.message}`);
      setState('idle');
    });

    socket.on('disconnect', (reason) => {
      console.log('[VideoDating] Disconnected:', reason);
      setState('idle');
      cleanup();
    });

    socket.on('queue:status', (data: { queueSize: number; searching?: boolean }) => {
      setQueueSize(data.queueSize);
      // If searching flag is set (from next partner), ensure we're in searching state
      if (data.searching) {
        setState('searching');
      }
    });

    socket.on('match:found', (data: MatchInfo & { blindDate?: { introMessage: string; initialTopic: string; blurLevel: number } }) => {
      setMatchInfo(data);
      setState('matched');

      // 🎬 AI DATING HOST: Initialize blind date state
      if (data.blindDate) {
        setBlindDate({
          introMessage: data.blindDate.introMessage,
          currentTopic: data.blindDate.initialTopic,
          blurLevel: data.blindDate.blurLevel,
          topicNumber: 1,
          isRescue: false,
          revealRequested: false,
        });
      }

      // Media already acquired in joinQueue, just setup peer connection
      setupPeerConnection(socket, data.sessionId, data.isInitiator);
    });

    // 🎬 AI DATING HOST: Blur update event
    socket.on('blind:blur_update', (data: { blurLevel: number; message: string }) => {
      setBlindDate(prev => prev ? { ...prev, blurLevel: data.blurLevel } : prev);
    });

    // 🎬 AI DATING HOST: New topic event
    socket.on('blind:new_topic', (data: { topic: string; isRescue: boolean; topicNumber: number }) => {
      setBlindDate(prev => prev ? {
        ...prev,
        currentTopic: data.topic,
        topicNumber: data.topicNumber,
        isRescue: data.isRescue,
      } : prev);
    });

    // 🎬 AI DATING HOST: Reveal requested
    socket.on('blind:reveal_requested', () => {
      setBlindDate(prev => prev ? { ...prev, revealRequested: true } : prev);
    });

    socket.on('call:offer', async (data: { sessionId: string; offer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('call:answer', {
          sessionId: data.sessionId,
          answer,
        });
      }
    });

    socket.on('call:answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(data.answer);
      }
    });

    socket.on('call:ice-candidate', async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.addIceCandidate(data.candidate);
      }
    });

    socket.on('call:ended', (data: { reason: string }) => {
      console.log('Call ended:', data.reason);
      cleanup();
      setState('ended');
    });

    socketRef.current = socket;
  }, [cleanup, setupPeerConnection]);

  // Request media BEFORE joining queue (on user click - has user gesture)
  const joinQueue = useCallback(async (intentMode: 'DATE' | 'STUDY' | 'FRIEND', genderPreference: 'male' | 'female' | 'all' = 'all', enableVideo: boolean = true) => {
    if (!socketRef.current) return;

    try {
      // Request media permissions NOW (while we have user gesture from button click)
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: enableVideo,
      };

      localStreamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(localStreamRef.current); // Trigger re-render
      setWithVideo(enableVideo);
      setState('searching');
      socketRef.current.emit('queue:join', { intentMode, genderPreference });
    } catch (err: unknown) {
      console.error('Error accessing media devices:', err);

      // If video failed, try audio only as fallback
      if (enableVideo) {
        try {
          console.log('Video failed, trying audio only...');
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setLocalStream(localStreamRef.current); // Trigger re-render
          setWithVideo(false);
          setState('searching');
          socketRef.current?.emit('queue:join', { intentMode, genderPreference });
          setError('Camera unavailable - joined with audio only');
          return;
        } catch {
          // Audio also failed
        }
      }

      // Complete failure
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Microphone/Camera permission denied. Please allow in browser settings and refresh.');
      } else {
        setError('Failed to access microphone. Please check your device settings.');
      }
    }
  }, []);

  const leaveQueue = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('queue:leave');
      cleanup(); // Stop media when leaving queue
      setState('idle');
    }
  }, [cleanup]);

  const nextPartner = useCallback(() => {
    if (socketRef.current && matchInfo) {
      cleanup(false); // Keep local stream
      socketRef.current.emit('call:next');
      setState('searching');
    }
  }, [matchInfo, cleanup]);

  const endCall = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('call:end');
      cleanup();
      setState('idle');
    }
  }, [cleanup]);

  const reportPartner = useCallback((reason: string) => {
    if (socketRef.current) {
      socketRef.current.emit('call:report', { reason });
      cleanup();
      setBlindDate(null);
      setState('idle');
    }
  }, [cleanup]);

  // 🎬 AI DATING HOST: Request new topic
  const requestNewTopic = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('blind:request_topic');
    }
  }, []);

  // 🎬 AI DATING HOST: Report activity (user is speaking)
  const reportActivity = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('blind:activity');
    }
  }, []);

  // 🎬 AI DATING HOST: Request early reveal
  const requestReveal = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('blind:request_reveal');
    }
  }, []);

  // 🎬 AI DATING HOST: Accept reveal request
  const acceptReveal = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('blind:accept_reveal');
      setBlindDate(prev => prev ? { ...prev, revealRequested: false } : prev);
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    setBlindDate(null);
    socketRef.current?.disconnect();
    socketRef.current = null;
    setState('idle');
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    matchInfo,
    error,
    localStream,
    remoteStream,
    remoteHasVideo,
    queueSize,
    withVideo,
    // 🎬 AI DATING HOST: Blind Date state and actions
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
    localStreamRef,
  };
}
