'use client';

import React, { useRef } from 'react';
import { MapPin, Briefcase, GraduationCap, Music, Instagram } from 'lucide-react';
import type { DiscoverUser } from '@/hooks/useDiscover';
import ProfilePropertiesGrid from './ProfilePropertiesGrid';

interface ProfileCardProps {
    user: DiscoverUser;
    onContentClick?: (contentId: string, contentType: 'photo' | 'prompt' | 'vibe') => void;
}

/**
 * ProfileCard - Notion Dark Theme styled profile card
 * Scrollable profile doc with cover image, details, and prompts
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
            className="w-full h-full bg-[#FDF0F1] rounded-[40px] shadow-xl shadow-[#CD6E67]/15 overflow-hidden flex flex-col"
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#FDF0F1] via-transparent to-transparent" />
            </div>

            {/* Scrollable Body - 60% */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 -mt-8 relative z-10">
                {/* Avatar + Name + Age + Location */}
                <div className="flex items-end gap-4 mb-4">
                    <div className="w-20 h-20 rounded-[20px] overflow-hidden border-4 border-white bg-[#ECC8CD] shadow-md flex-shrink-0">
                        <img
                            src={user.photos?.[1]?.url || coverPhoto}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-black text-[#3E3229] truncate">
                            {user.display_name}
                            {user.age && <span className="ml-2 font-extrabold">{user.age}</span>}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {user.location && (
                                <p className="text-sm text-[#7A6862] font-semibold flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {user.location}
                                </p>
                            )}
                            {/* Distance badge from PostGIS */}
                            {user.distance_km !== undefined && user.distance_km !== null && (
                                <span className="px-2 py-1 bg-[#ECC8CD] text-[#3E3229] text-xs rounded-full flex items-center gap-1 font-bold shadow-sm">
                                    <MapPin className="w-3 h-3" />
                                    {user.distance_km < 1
                                        ? `${Math.round(user.distance_km * 1000)}m`
                                        : `${user.distance_km.toFixed(1)}km`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Occupation & Education */}
                <div className="space-y-2 mb-5">
                    {user.occupation && (
                        <div className="flex items-center gap-2 text-sm text-[#7A6862] font-semibold">
                            <Briefcase className="w-4 h-4 flex-shrink-0 text-[#CD6E67]" />
                            <span className="truncate">{user.occupation}</span>
                        </div>
                    )}
                    {user.education && (
                        <div className="flex items-center gap-2 text-sm text-[#7A6862] font-semibold">
                            <GraduationCap className="w-4 h-4 flex-shrink-0 text-[#CD6E67]" />
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
                        <h3 className="text-xs font-extrabold text-[#7A6862] uppercase tracking-wider mb-3">
                            My Vibe
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user.tags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onContentClick?.(`tag-${idx}`, 'vibe')}
                                    className="px-3 py-2 text-sm bg-white text-[#3E3229] font-bold rounded-[15px] shadow-sm hover:bg-[#CD6E67] hover:text-white transition-all"
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
                        <h3 className="text-xs font-extrabold text-[#7A6862] uppercase tracking-wider mb-3">
                            About Me
                        </h3>
                        <p className="text-sm text-[#3E3229] font-semibold leading-relaxed">
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
                                className="w-full text-left p-4 bg-white rounded-[20px] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{prompt.emoji || '💬'}</span>
                                    <span className="text-xs font-extrabold text-[#7A6862] uppercase tracking-wide">
                                        {prompt.question}
                                    </span>
                                </div>
                                <p className="text-sm text-[#3E3229] font-semibold">{prompt.answer}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Spotify & Instagram */}
                <div className="flex items-center gap-4 text-xs text-[#7A6862] font-semibold">
                    {user.spotify && (
                        <div className="flex items-center gap-1.5">
                            <Music className="w-4 h-4 text-[#CD6E67]" />
                            <span className="truncate max-w-[120px]">
                                {user.spotify.song}
                            </span>
                        </div>
                    )}
                    {user.instagram && (
                        <div className="flex items-center gap-1.5">
                            <Instagram className="w-4 h-4 text-[#CD6E67]" />
                            <span>{user.instagram}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
