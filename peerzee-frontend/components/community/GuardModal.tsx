'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Star, Volume2, AlertTriangle } from 'lucide-react';
import type { ModerationResultEvent } from '@/hooks/useModerationSocket';

// ─── RPG Message Map ─────────────────────────────────────────────────────────

const BLACKLIST_MESSAGES = [
    '⚔️ Vệ Binh đã chặn phát ngôn của ngươi vì chứa ngôn từ thù ghét!',
    '🛡️ Phép thuật hắc ám (ngôn từ cấm) không được phép tại làng này!',
    '⚔️ Ta đã nghe thấy những lời bất hảo đó. Hãy chọn lời nói khác đi!',
];

const AI_MESSAGES = [
    '🔮 Tiên Tri Gemini đã nhìn thấu nội dung của ngươi và phán: VI PHẠM!',
    '👁️ Đôi mắt ma thuật của Hội Đồng đã phát hiện ngôn từ xúc phạm!',
    '📜 Phép soi xét đã phát hiện nội dung vi phạm nội quy ngôi làng!',
];

function getRandomMessage(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Pixel Guard ASCII Art ────────────────────────────────────────────────────

const GUARD_SPRITE = `
  ┌───────┐
  │ (ò_ó) │
  │  [▣▣] │
  │  /||\\  │
  │   ||   │
  │  /  \\  │
  └───────┘
`.trim();

// ─── Props ────────────────────────────────────────────────────────────────────

interface GuardModalProps {
    event: ModerationResultEvent | null;
    /** Current user's violation count (to show mute warning) */
    violationCount?: number;
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuardModal({ event, violationCount = 0, onClose }: GuardModalProps) {
    const [isFlashing, setIsFlashing] = useState(false);

    // Trigger red flash when a new event arrives — modal shows immediately
    useEffect(() => {
        if (!event) return;
        setIsFlashing(true);
        const t = setTimeout(() => setIsFlashing(false), 400);
        return () => clearTimeout(t);
    }, [event]);

    // Modal is shown as soon as event is non-null — no 400ms delay
    if (!event) return null;

    const isBlacklist = event.violationType === 'BLACKLIST';
    const rpgMessage = isBlacklist
        ? getRandomMessage(BLACKLIST_MESSAGES)
        : getRandomMessage(AI_MESSAGES);

    // How many violations before mute
    const MUTE_THRESHOLD = 3;
    const violationsAfter = violationCount + 1;
    const willBeMuted = violationsAfter >= MUTE_THRESHOLD;
    const warningsLeft = Math.max(0, MUTE_THRESHOLD - violationsAfter);

    const handleClose = () => {
        setTimeout(onClose, 200);
    };

    return (
        <>
            {/* ── Red Screen Flash ── */}
            {isFlashing && (
                <div
                    className="fixed inset-0 z-[9998] pointer-events-none"
                    style={{
                        background: 'rgba(240, 80, 80, 0.55)',
                        animation: 'guardFlash 0.4s ease-out forwards',
                    }}
                />
            )}

            {/* ── Modal Overlay ── */}
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.65)' }}
                onClick={handleClose}
            >
                    {/* ── Modal Box ── */}
                    <div
                        className="relative max-w-sm w-full bg-retro-white border-4 border-cocoa shadow-[6px_6px_0_#4A3728] rounded-none overflow-hidden"
                        style={{ imageRendering: 'pixelated' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header bar — red/danger */}
                        <div className="bg-pixel-red border-b-4 border-cocoa px-4 py-2 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-cocoa" strokeWidth={3} />
                            <span className="font-pixel text-sm uppercase tracking-wider text-cocoa font-bold">
                                ⚔ VỆ BINH THÀNH
                            </span>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Guard sprite + message */}
                            <div className="flex gap-4 items-start">
                                {/* ASCII Guard */}
                                <pre
                                    className="font-mono text-[9px] leading-tight text-cocoa bg-retro-bg border-2 border-cocoa px-2 py-1 select-none shrink-0"
                                    aria-hidden="true"
                                >
                                    {GUARD_SPRITE}
                                </pre>

                                {/* Speech bubble */}
                                <div className="relative bg-parchment border-2 border-cocoa px-3 py-2 flex-1">
                                    {/* bubble tail */}
                                    <div className="absolute left-0 top-3 -translate-x-[10px] w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-cocoa" />
                                    <p className="font-pixel text-xs text-cocoa leading-relaxed">
                                        {rpgMessage}
                                    </p>
                                    {event.reason && (
                                        <p className="font-body text-[11px] text-cocoa-light mt-1 italic">
                                            "{event.reason}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Punishment stats */}
                            <div className="border-2 border-cocoa bg-retro-paper px-3 py-2 space-y-1.5">
                                <p className="font-pixel text-[10px] uppercase text-cocoa-light tracking-widest">
                                    Hình phạt nhận được:
                                </p>
                                {/* Reputation deduction */}
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-pixel-yellow fill-pixel-yellow" strokeWidth={1.5} />
                                    <span className="font-pixel text-xs text-cocoa">Uy Tín</span>
                                    <span className="ml-auto font-pixel text-sm text-pixel-red font-bold">
                                        -10
                                    </span>
                                </div>
                            </div>

                            {/* Mute warning */}
                            {willBeMuted ? (
                                <div className="flex items-start gap-2 border-2 border-pixel-red bg-pixel-red/10 px-3 py-2">
                                    <Volume2 className="w-4 h-4 text-pixel-red shrink-0 mt-0.5" strokeWidth={2.5} />
                                    <p className="font-pixel text-[10px] text-pixel-red leading-relaxed">
                                        ⚠ Ngươi đã bị áp dụng hiệu ứng{' '}
                                        <strong>Cấm Ngôn (Silenced) 24 giờ!</strong>{' '}
                                        Không thể đăng bài hay bình luận trong thời gian này.
                                    </p>
                                </div>
                            ) : warningsLeft > 0 ? (
                                <div className="flex items-start gap-2 border-2 border-pixel-yellow bg-pixel-yellow/20 px-3 py-2">
                                    <AlertTriangle className="w-4 h-4 text-cocoa shrink-0 mt-0.5" strokeWidth={2.5} />
                                    <p className="font-pixel text-[10px] text-cocoa leading-relaxed">
                                        ⚠ Cảnh báo! Còn{' '}
                                        <strong>{warningsLeft} lần</strong> vi phạm nữa sẽ bị{' '}
                                        <strong>Cấm Ngôn 24 giờ.</strong>
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        <div className="border-t-4 border-cocoa px-4 py-3 bg-retro-bg flex justify-end">
                            <button
                                onClick={handleClose}
                                className="font-pixel text-xs text-cocoa bg-pixel-yellow border-2 border-cocoa px-4 py-2 uppercase tracking-wide shadow-[2px_2px_0_#4A3728] hover:bg-pixel-yellow/80 active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                Dạ, hiểu rồi ạ! ✓
                            </button>
                        </div>
                    </div>
                </div>

            {/* ── Keyframe styles (injected once) ── */}
            <style>{`
                @keyframes guardFlash {
                    0%   { opacity: 0.8; }
                    40%  { opacity: 0.6; }
                    70%  { opacity: 0.4; }
                    100% { opacity: 0; }
                }
            `}</style>
        </>
    );
}
