'use client';

import React, { useRef } from 'react';
import { Briefcase, GraduationCap, Music, Instagram, MessageSquareText, Eye } from 'lucide-react';
import type { DiscoverUser } from '@/hooks/useDiscover';
import ProfilePropertiesGrid from './ProfilePropertiesGrid';
import { getAssetUrl } from '@/lib/api';

interface ProfileCardProps {
    user: DiscoverUser;
    onContentClick?: (contentId: string, contentType: 'photo' | 'prompt' | 'vibe') => void;
    onViewProfile?: () => void;
}

/**
 * ProfileCard - Retro Pixel OS styled profile card
 * Scrollable profile doc with cover image, details, and prompts
 */
export default function ProfileCard({ user, onContentClick, onViewProfile }: ProfileCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Get cover photo or fallback
    const coverPhoto = getAssetUrl(user.photos?.find((p) => p.isCover)?.url)
        || getAssetUrl(user.photos?.[0]?.url)
        || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;

    return (
        <div
            ref={cardRef}
            className="w-full h-full bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel overflow-hidden flex flex-col"
        >
            {/* Cover Image - 45% height */}
            <div className="relative h-[45%] min-h-[200px] flex-shrink-0">
                <img
                    src={coverPhoto}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                    onClick={() => user.photos?.[0]?.id && onContentClick?.(user.photos[0].id, 'photo')}
                />
                {/* View Profile Button on Cover */}
                {onViewProfile && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile();
                        }}
                        className="absolute top-4 right-4 z-20 px-3 py-2 bg-retro-white/90 backdrop-blur-sm border-2 border-cocoa rounded-lg shadow-pixel-sm flex items-center gap-2 hover:bg-pixel-yellow transition-colors"
                    >
                        <Eye className="w-4 h-4 text-cocoa" />
                        <span className="text-xs font-pixel text-cocoa uppercase tracking-wider">Xem</span>
                    </button>
                )}
                {/* Gradient overlay + name/age/location */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10 pointer-events-none">
                    <h2 className="text-lg font-pixel uppercase tracking-widest text-white truncate leading-tight">
                        {user.display_name}{user.age ? `, ${user.age}` : ''}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {user.location && (
                            <span className="text-white/80 text-xs font-bold">{user.location}</span>
                        )}
                        {user.distance_km !== undefined && user.distance_km !== null && (
                            <span className="text-white/70 text-xs">
                                · {user.distance_km < 1
                                    ? `${Math.round(user.distance_km * 1000)}m`
                                    : `${user.distance_km.toFixed(1)}km`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 relative z-10">
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border-3 border-cocoa bg-pixel-pink shadow-pixel flex-shrink-0">
                        <img
                            src={getAssetUrl(user.photos?.[1]?.url) || coverPhoto}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Occupation & Education */}
                <div className="space-y-2 mb-5">
                    {user.occupation && (
                        <div className="flex items-center gap-2 text-sm text-cocoa font-bold">
                            <Briefcase className="w-4 h-4 flex-shrink-0 text-pixel-pink" />
                            <span className="truncate">{user.occupation}</span>
                        </div>
                    )}
                    {user.education && (
                        <div className="flex items-center gap-2 text-sm text-cocoa font-bold">
                            <GraduationCap className="w-4 h-4 flex-shrink-0 text-pixel-purple" />
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
                        <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa mb-3">
                            My Vibe
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user.tags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onContentClick?.(`tag-${idx}`, 'vibe')}
                                    className="px-3 py-1.5 text-sm bg-pixel-yellow text-cocoa font-bold rounded-lg border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-pink hover:translate-y-0.5 hover:shadow-none transition-all"
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
                        <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa mb-3">
                            About Me
                        </h3>
                        <p className="text-sm text-cocoa font-medium leading-relaxed">
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
                                className="w-full text-left p-4 bg-retro-paper border-2 border-cocoa rounded-xl shadow-pixel-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    {prompt.emoji ? (
                                        <span className="text-lg">{prompt.emoji}</span>
                                    ) : (
                                        <MessageSquareText className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
                                    )}
                                    <span className="text-xs font-pixel uppercase tracking-widest text-cocoa-light">
                                        {prompt.question}
                                    </span>
                                </div>
                                <p className="text-sm text-cocoa font-bold">{prompt.answer}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Spotify & Instagram */}
                <div className="flex items-center gap-4 text-xs text-cocoa font-bold">
                    {user.spotify && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pixel-green rounded-lg border-2 border-cocoa shadow-pixel-sm">
                            <Music className="w-4 h-4 text-cocoa" />
                            <span className="truncate max-w-[120px]">
                                {user.spotify.song}
                            </span>
                        </div>
                    )}
                    {user.instagram && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pixel-pink rounded-lg border-2 border-cocoa shadow-pixel-sm">
                            <Instagram className="w-4 h-4 text-cocoa" />
                            <span>{user.instagram}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
