'use client';

import React, { useRef } from 'react';
import { MapPin, Briefcase, GraduationCap, Music, Instagram } from 'lucide-react';
import type { DiscoverUser } from '@/hooks/useDiscover';
import ProfilePropertiesGrid from './ProfilePropertiesGrid';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa
  textMuted: '#5D4037',      // Medium Brown
  background: '#FFFFFF',      // Pure White
  border: '#4A3228',          // Dark Coffee
  pink: '#F4B0C8',            // Retro Pink
  green: '#98D689',           // Pixel Green
  yellow: '#FFE082',          // Soft Yellow
  cardBg: '#FFF9F5',          // Warm White
} as const;

interface ProfileCardProps {
    user: DiscoverUser;
    onContentClick?: (contentId: string, contentType: 'photo' | 'prompt' | 'vibe') => void;
}

/**
 * ProfileCard - High Contrast Retro OS Style
 * Scrollable profile with pixel borders and hard shadows
 */
export default function ProfileCard({ user, onContentClick }: ProfileCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Get cover photo or fallback
    const coverPhoto = user.photos?.find((p) => p.isCover)?.url
        || user.photos?.[0]?.url
        || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

    return (
        <div
            ref={cardRef}
            className="w-full h-full border-[4px] rounded-lg overflow-hidden flex flex-col shadow-[6px_6px_0px_#4A3228]"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.cardBg }}
        >
            {/* Cover Image - 40% height */}
            <div className="relative h-[40%] min-h-[240px] flex-shrink-0">
                <img
                    src={coverPhoto}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                    onClick={() => user.photos?.[0]?.id && onContentClick?.(user.photos[0].id, 'photo')}
                />
                {/* Gradient overlay */}
                <div 
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${COLORS.cardBg}, transparent 50%)` }}
                />
                
                {/* Distance Badge */}
                {user.distance_km !== undefined && user.distance_km !== null && (
                    <div 
                        className="absolute top-3 right-3 px-3 py-1 border-[2px] flex items-center gap-1 font-pixel text-xs"
                        style={{ 
                            backgroundColor: COLORS.green, 
                            borderColor: COLORS.border,
                            color: COLORS.border 
                        }}
                    >
                        <MapPin className="w-3 h-3" />
                        {user.distance_km < 1
                            ? `${Math.round(user.distance_km * 1000)}m`
                            : `${user.distance_km.toFixed(1)}km`}
                    </div>
                )}
            </div>

            {/* Scrollable Body - 60% */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 -mt-8 relative z-10">
                {/* Avatar + Name + Age + Location */}
                <div className="flex items-end gap-4 mb-4">
                    <div 
                        className="w-20 h-20 overflow-hidden border-[3px] flex-shrink-0"
                        style={{ borderColor: COLORS.border, backgroundColor: COLORS.pink }}
                    >
                        <img
                            src={user.photos?.[1]?.url || coverPhoto}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 
                            className="font-pixel text-xl truncate uppercase"
                            style={{ color: COLORS.text }}
                        >
                            {user.display_name}
                            {user.age && (
                                <span 
                                    className="ml-2 px-2 py-0.5 text-sm border-[2px]"
                                    style={{ 
                                        backgroundColor: COLORS.yellow, 
                                        borderColor: COLORS.border 
                                    }}
                                >
                                    LVL {user.age}
                                </span>
                            )}
                        </h2>
                        {user.location && (
                            <p 
                                className="text-sm font-bold flex items-center gap-1 mt-1"
                                style={{ color: COLORS.textMuted }}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                {user.location}
                            </p>
                        )}
                    </div>
                </div>

                {/* Occupation & Education */}
                <div className="space-y-2 mb-5">
                    {user.occupation && (
                        <div 
                            className="flex items-center gap-2 text-sm font-bold"
                            style={{ color: COLORS.text }}
                        >
                            <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.border }} />
                            <span className="truncate">{user.occupation}</span>
                        </div>
                    )}
                    {user.education && (
                        <div 
                            className="flex items-center gap-2 text-sm font-bold"
                            style={{ color: COLORS.text }}
                        >
                            <GraduationCap className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.border }} />
                            <span className="truncate">{user.education}</span>
                        </div>
                    )}
                </div>

                {/* Profile Properties (Zodiac, MBTI, Habits) */}
                {user.profileProperties && (
                    <ProfilePropertiesGrid properties={user.profileProperties} />
                )}

                {/* Tags / Vibes */}
                {user.tags && user.tags.length > 0 && (
                    <div className="mb-5">
                        <h3 
                            className="font-pixel text-xs uppercase tracking-wider mb-3"
                            style={{ color: COLORS.textMuted }}
                        >
                            ⚔️ MY VIBES
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user.tags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onContentClick?.(`tag-${idx}`, 'vibe')}
                                    className="px-3 py-1.5 text-xs font-bold border-[2px] transition-all hover:translate-y-[-2px]"
                                    style={{ 
                                        backgroundColor: COLORS.background, 
                                        borderColor: COLORS.border,
                                        color: COLORS.text,
                                        boxShadow: `2px 2px 0px ${COLORS.border}`
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bio */}
                {user.bio && (
                    <div className="mb-5">
                        <h3 
                            className="font-pixel text-xs uppercase tracking-wider mb-3"
                            style={{ color: COLORS.textMuted }}
                        >
                            📜 ABOUT ME
                        </h3>
                        <p 
                            className="text-sm font-body leading-relaxed"
                            style={{ color: COLORS.text }}
                        >
                            {user.bio}
                        </p>
                    </div>
                )}

                {/* Prompts */}
                {user.prompts && user.prompts.length > 0 && (
                    <div className="space-y-3 mb-5">
                        {user.prompts.map((prompt, idx) => (
                            <button
                                key={prompt.id || idx}
                                onClick={() => onContentClick?.(prompt.id || `prompt-${idx}`, 'prompt')}
                                className="w-full text-left p-4 border-[3px] transition-all hover:translate-y-[-2px]"
                                style={{ 
                                    backgroundColor: COLORS.background, 
                                    borderColor: COLORS.border,
                                    boxShadow: `3px 3px 0px ${COLORS.border}`
                                }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{prompt.emoji || '💬'}</span>
                                    <span 
                                        className="font-pixel text-xs uppercase tracking-wide"
                                        style={{ color: COLORS.textMuted }}
                                    >
                                        {prompt.question}
                                    </span>
                                </div>
                                <p 
                                    className="text-sm font-body font-bold"
                                    style={{ color: COLORS.text }}
                                >
                                    {prompt.answer}
                                </p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Spotify & Instagram */}
                <div 
                    className="flex items-center gap-4 text-xs font-bold"
                    style={{ color: COLORS.textMuted }}
                >
                    {user.spotify && (
                        <div className="flex items-center gap-1.5">
                            <Music className="w-4 h-4" style={{ color: COLORS.green }} />
                            <span className="truncate max-w-[120px]">
                                {user.spotify.song}
                            </span>
                        </div>
                    )}
                    {user.instagram && (
                        <div className="flex items-center gap-1.5">
                            <Instagram className="w-4 h-4" style={{ color: COLORS.pink }} />
                            <span>{user.instagram}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
