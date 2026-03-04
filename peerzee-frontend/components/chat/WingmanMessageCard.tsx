'use client';

import React, { useMemo } from 'react';
import { Sparkles, MapPin, Navigation, MessageCircle, CalendarDays, Clock } from 'lucide-react';

interface WingmanSuggestion {
    place_name: string;
    address: string;
    google_maps_url: string;
    reason: string;
}

interface WingmanMentionResult {
    type?: 'venues';
    wingman_message: string;
    suggestions: WingmanSuggestion[];
    follow_up_question: string;
}

interface ItineraryStep {
    startTime: string;
    endTime: string;
    activityType: 'dining' | 'cafe' | 'entertainment' | 'travel';
    locationName: string;
    locationUrl: string;
    description: string;
    estimatedCost: number;
    recommendedItems?: string[];
}

interface ItineraryPlan {
    type: 'itinerary';
    title: string;
    date: string;
    durationSummary: string;
    totalBudgetLimit: number;
    totalEstimatedCost: number;
    currency: string;
    steps: ItineraryStep[];
}

type WingmanData = WingmanMentionResult | ItineraryPlan;

interface WingmanMessageCardProps {
    body: string;
    compact?: boolean;
}

const CARD_ACCENT_COLORS = [
    { strip: 'bg-pixel-purple', badge: 'bg-pixel-purple text-white', num: 'text-pixel-purple' },
    { strip: 'bg-pixel-blue',   badge: 'bg-pixel-blue text-cocoa',   num: 'text-cocoa-light' },
];

const fmt = (n: number) => n.toLocaleString('vi-VN');

export default function WingmanMessageCard({ body, compact = false }: WingmanMessageCardProps) {
    const data = useMemo<WingmanData | null>(() => {
        try { return JSON.parse(body); } catch { return null; }
    }, [body]);

    const isItinerary = data?.type === 'itinerary';

    return (
        <div className={`flex items-start gap-2 ${compact ? 'my-1 px-3' : 'my-4 px-4'}`}>
            {!compact && (
                <div className="w-9 h-9 border-2 border-cocoa rounded-lg bg-pixel-purple flex items-center justify-center shrink-0 mt-0.5 shadow-pixel-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            )}

            <div
                className="flex-1 min-w-0"
                style={{ maxWidth: compact ? '100%' : (isItinerary ? '100%' : 'min(85%, 520px)') }}
            >
                {!compact && <span className="text-xs text-cocoa-light font-bold mb-1 block ml-1">🤖 Wingman</span>}

                {!data ? (
                    <div className="bg-retro-white border-2 border-cocoa/30 rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-cocoa-light italic">
                        Wingman gặp sự cố...
                    </div>

                ) : data.type === 'itinerary' ? (
                    /* ── ITINERARY TIMELINE ── */
                    <div className="bg-retro-paper border-2 border-cocoa rounded-2xl rounded-tl-sm overflow-hidden shadow-pixel-sm">

                        {/* Purple header banner */}
                        <div className="bg-pixel-purple px-5 py-4">
                            <div className="flex items-center gap-2 mb-1.5">
                                <CalendarDays className="w-4 h-4 text-white/70 shrink-0" />
                                <span className="font-pixel text-white/70 text-[10px] uppercase tracking-widest">Kế hoạch hẹn hò</span>
                            </div>
                            <p className="font-pixel text-white text-base leading-snug">{data.title}</p>
                            <p className="text-white/60 text-xs mt-1 font-bold">{data.date}</p>
                        </div>

                        {/* Budget & duration summary bar */}
                        <div className="px-5 py-3 bg-retro-white border-b-2 border-cocoa/15 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Clock className="w-4 h-4 text-cocoa shrink-0" />
                                <span className="text-sm font-bold text-cocoa truncate">{data.durationSummary}</span>
                            </div>
                            {(data.totalBudgetLimit > 0) && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-sm font-bold text-cocoa">{fmt(data.totalEstimatedCost)}đ</span>
                                    <span className="text-sm text-cocoa/40">/</span>
                                    <span className="text-sm font-pixel text-pixel-purple">{fmt(data.totalBudgetLimit)}đ</span>
                                </div>
                            )}
                        </div>

                        {/* Steps */}
                        <div className="flex flex-col divide-y divide-cocoa/10">
                            {data.steps.map((step, i) => {
                                const isTravel = step.activityType === 'travel';
                                return (
                                    <div key={i} className="flex gap-3 px-5 py-4">
                                        {/* Time column */}
                                        <div className="w-16 shrink-0 text-right pt-0.5">
                                            <span className="font-pixel text-xs text-pixel-purple leading-tight block">{step.startTime}</span>
                                            <span className="font-pixel text-xs text-cocoa leading-tight block">→ {step.endTime}</span>
                                        </div>

                                        {/* Connector */}
                                        <div className="flex flex-col items-center shrink-0">
                                            <div className={`w-3 h-3 rounded-full border-2 border-cocoa mt-1 shrink-0 ${isTravel ? 'bg-cocoa/40' : 'bg-pixel-purple'}`} />
                                            {i < data.steps.length - 1 && (
                                                <div className="w-0.5 bg-cocoa/20 flex-1 mt-1.5" style={{ minHeight: '1.5rem' }} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {isTravel ? (
                                                <p className="text-cocoa text-sm font-bold italic leading-relaxed">{step.description}</p>
                                            ) : (
                                                <>
                                                    <p className="text-cocoa text-base font-bold leading-snug">{step.locationName}</p>

                                                    {step.locationName && (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <MapPin className="w-3.5 h-3.5 text-cocoa shrink-0" />
                                                            <span className="text-sm font-bold text-cocoa">{step.activityType === 'dining' ? 'Ăn uống' : step.activityType === 'cafe' ? 'Cà phê' : 'Vui chơi'}</span>
                                                        </div>
                                                    )}

                                                    <p className="text-cocoa text-sm mt-2 leading-relaxed">{step.description}</p>

                                                    {/* Recommended items */}
                                                    {step.recommendedItems && step.recommendedItems.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {step.recommendedItems.map((item, j) => (
                                                                <span key={j} className="inline-flex items-center gap-1 text-xs font-bold text-cocoa bg-pixel-pink/20 border border-pixel-pink/40 rounded-full px-2.5 py-0.5">
                                                                    ✦ {item}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Cost badge */}
                                                    {step.estimatedCost > 0 && (
                                                        <span className="mt-2 inline-block text-sm font-pixel text-pixel-purple bg-pixel-purple/10 border border-pixel-purple/30 rounded px-2.5 py-1">
                                                            ~{fmt(step.estimatedCost)}đ
                                                        </span>
                                                    )}

                                                    {/* Google Maps button */}
                                                    {step.locationUrl && (
                                                        <a
                                                            href={step.locationUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-pixel-blue border-2 border-cocoa rounded-lg shadow-pixel-sm font-pixel text-xs text-cocoa tracking-wide hover:translate-y-0.5 hover:shadow-none transition-all active:translate-y-1 active:shadow-none"
                                                        >
                                                            <Navigation className="w-3 h-3 shrink-0" />
                                                            Google Maps
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                ) : (
                    /* ── VENUE SUGGESTIONS ── */
                    <div className="bg-retro-paper border-2 border-cocoa rounded-2xl rounded-tl-sm overflow-hidden shadow-pixel-sm">
                        <div className="px-4 pt-3 pb-3">
                            <p className="text-cocoa text-sm font-bold leading-relaxed">{data.wingman_message}</p>
                        </div>

                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            {data.suggestions.map((s, i) => {
                                const accent = CARD_ACCENT_COLORS[i % CARD_ACCENT_COLORS.length];
                                return (
                                    <div key={i} className="bg-retro-white border-2 border-cocoa rounded-xl overflow-hidden flex flex-col shadow-pixel-sm">
                                        <div className={`${accent.strip} px-3 py-1.5 flex items-center justify-between`}>
                                            <span className="font-pixel text-white text-xs tracking-widest uppercase truncate pr-2">{s.place_name}</span>
                                            <span className="font-pixel text-white/70 text-base shrink-0">0{i + 1}</span>
                                        </div>
                                        <div className="p-3 flex flex-col gap-2 flex-1">
                                            <div className="flex items-start gap-1.5 text-cocoa-light text-xs">
                                                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{s.address}</span>
                                            </div>
                                            <p className="text-cocoa text-xs leading-relaxed flex-1">{s.reason}</p>
                                            <a
                                                href={s.google_maps_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-pixel-blue border-2 border-cocoa rounded-lg shadow-pixel-sm font-pixel text-sm text-cocoa tracking-wide hover:translate-y-0.5 hover:shadow-none transition-all active:translate-y-1 active:shadow-none"
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                                Google Maps
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {data.follow_up_question && (
                            <div className="px-4 py-3 bg-pixel-pink/15 border-t-2 border-cocoa/20">
                                <div className="flex items-start gap-2">
                                    <MessageCircle className="w-3.5 h-3.5 text-cocoa mt-0.5 shrink-0" />
                                    <p className="text-cocoa text-xs font-bold leading-relaxed">{data.follow_up_question}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
