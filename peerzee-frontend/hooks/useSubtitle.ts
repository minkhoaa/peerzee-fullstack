'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface RemoteSubtitle {
  text: string;
  isFinal: boolean;
  userId?: string;
}

interface UseSubtitleOptions {
  /** Active socket from useVideoDating */
  socket: Socket | null;
  /** Current session / room ID */
  sessionId: string | null;
  /** BCP-47 language tag. Falls back to 'vi-VN' */
  language?: string;
  /** Set to false to pause recognition (e.g. when call is idle) */
  enabled?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useSubtitle
 *
 * Drives the full subtitle pipeline:
 *   Web Speech API → socket.emit('subtitle:send') → [server relay] →
 *   socket.on('subtitle:receive') → remoteSubtitle state
 *
 * Exposes:
 *  - localInterim    : partial transcript while the user is speaking
 *  - remoteSubtitle  : latest subtitle received from the partner
 *  - isListening     : whether the microphone is actively recognised
 */
export function useSubtitle({
  socket,
  sessionId,
  language = 'vi-VN',
  enabled = true,
}: UseSubtitleOptions) {
  // ── Local speech ──────────────────────────────────────────────────────────
  const [localInterim, setLocalInterim] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);

  // ── Remote subtitle ───────────────────────────────────────────────────────
  const [remoteSubtitle, setRemoteSubtitle] = useState<RemoteSubtitle | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const remoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-clear remote subtitle after 4 s of silence ──────────────────────
  const scheduleRemoteClear = useCallback(() => {
    if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
    remoteTimerRef.current = setTimeout(() => setRemoteSubtitle(null), 4000);
  }, []);

  // ── Listen for incoming subtitles from partner ────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (data: { text: string; isFinal: boolean; userId?: string }) => {
      setRemoteSubtitle({ text: data.text, isFinal: data.isFinal, userId: data.userId });
      scheduleRemoteClear();
    };

    socket.on('subtitle:receive', onReceive);
    return () => {
      socket.off('subtitle:receive', onReceive);
    };
  }, [socket, scheduleRemoteClear]);

  // ── Speech Recognition lifecycle ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.stop();
      setLocalInterim('');
      setIsListening(false);
      return;
    }

    // Guard: SSR / unsupported browser
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: (new () => any) | undefined =
      typeof window !== 'undefined'
        ? w.SpeechRecognition ?? w.webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionAPI) {
      console.warn('[useSubtitle] SpeechRecognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      // ── Interim: debounce socket emit to avoid flooding ──────────────────
      if (interim) {
        setLocalInterim(interim);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          socket?.emit('subtitle:send', { text: interim, isFinal: false, sessionId });
        }, 150);
      }

      // ── Final: emit immediately, clear interim buffer ─────────────────────
      if (finalText) {
        setLocalInterim('');
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        socket?.emit('subtitle:send', { text: finalText, isFinal: true, sessionId });
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      // 'no-speech' is benign; just let it restart
      if (event.error !== 'no-speech') {
        console.error('[useSubtitle] SpeechRecognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart to keep continuous recognition alive
      if (enabled && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          // May throw if recognition was stopped intentionally
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('[useSubtitle] Failed to start recognition:', err);
    }

    return () => {
      recognitionRef.current = null;
      recognition.stop();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  // Restart whenever language or enabled flag changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, language]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (remoteTimerRef.current) clearTimeout(remoteTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return {
    /** Partial transcript while the local user is speaking */
    localInterim,
    /** Latest subtitle data received from the remote partner */
    remoteSubtitle,
    /** Whether the mic is currently capturing speech */
    isListening,
  };
}
