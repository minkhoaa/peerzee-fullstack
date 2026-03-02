'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Subtitle entry coming from the partner via socket */
export interface SubtitleData {
  text: string;
  isFinal: boolean;
  userId?: string;
}

interface SubtitleOverlayProps {
  /** Text to display (null = hidden) */
  text: string | null;
  /** True when the partner has finished the utterance; false = interim (still speaking) */
  isFinal?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Corner pixel ornament
// ─────────────────────────────────────────────────────────────────────────────

const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const coords: Record<string, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  };
  return <span className={`absolute w-[5px] h-[5px] bg-white/90 ${coords[pos]}`} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SubtitleOverlay — Retro RPG Dialog Box
 *
 * Renders speech-to-text captions inside a pixel-art styled semi-transparent
 * box anchored to the bottom of the video tile.
 *
 * Visual anatomy:
 * ┌──────────────────────────────────┐
 * │  ▌ text being spoken...          │  ← interim  (gray + blinking cursor)
 * │  Committed sentence.             │  ← final    (white, solid)
 * └──────────────────────────────────┘
 *
 * - Font  : VT323 (pixel / retro RPG)
 * - Box   : bg-black/60, 2-px white border, pixel-style box-shadow
 * - Motion: fade + slide-up on enter / fade + slide-down on exit
 */
export default function SubtitleOverlay({ text, isFinal = false }: SubtitleOverlayProps) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          key="subtitle-box"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute bottom-4 left-3 right-3 z-20 pointer-events-none flex justify-center"
        >
          {/* ── RPG dialog box ─────────────────────────────────────────────── */}
          <div
            className="relative px-4 py-2.5 max-w-lg w-full"
            style={{
              background: 'rgba(0, 0, 0, 0.62)',
              border: '2px solid rgba(255,255,255,0.82)',
              /* Classic pixel-art inset + drop shadow */
              boxShadow:
                'inset 1px 1px 0 rgba(255,255,255,0.12), 3px 3px 0 rgba(0,0,0,0.75)',
              imageRendering: 'pixelated',
            }}
          >
            {/* Pixel corner ornaments */}
            <Corner pos="tl" />
            <Corner pos="tr" />
            <Corner pos="bl" />
            <Corner pos="br" />

            {/* ── Text ─────────────────────────────────────────────────────── */}
            <p
              className="text-center leading-snug select-none"
              style={{
                fontFamily: '"VT323", monospace',
                fontSize: '20px',
                letterSpacing: '0.04em',
                color: isFinal ? '#ffffff' : '#9ca3af',
              }}
            >
              {text}

              {/* Blinking cursor while speech is still in-progress */}
              {!isFinal && (
                <span
                  className="animate-pulse ml-0.5"
                  style={{ fontFamily: '"VT323", monospace', color: '#6b7280' }}
                  aria-hidden="true"
                >
                  ▌
                </span>
              )}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
