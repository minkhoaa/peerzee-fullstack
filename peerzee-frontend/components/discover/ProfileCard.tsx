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
            className="w-full h-full bg-[#202020] border border-[#2F2F2F] rounded-2xl overflow-hidden flex flex-col"
        >
            {/* Cover Image - 30% height */}
            <div className="relative h-[30%] min-h-[180px] flex-shrink-0">
                <img
                    src={coverPhoto}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                    onClick={() => user.photos?.[0]?.id && onContentClick?.(user.photos[0].id, 'photo')}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-transparent to-transparent" />
            </div>

            {/* Scrollable Body - 70% */}
            <div className="flex-1 overflow-y-auto px-5 pb-5 -mt-8 relative z-10">
                {/* Avatar + Name + Age + Location */}
                <div className="flex items-end gap-4 mb-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#2F2F2F] bg-[#191919] flex-shrink-0">
                        <img
                            src={user.photos?.[1]?.url || coverPhoto}
                            alt={user.display_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-semibold text-[#E3E3E3] truncate">
                            {user.display_name}
                            {user.age && <span className="ml-2 font-normal">{user.age}</span>}
                        </h2>
                        {user.location && (
                            <p className="text-sm text-[#9B9A97] flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" />
                                {user.location}
                            </p>
                        )}
                    </div>
                </div>

                {/* Occupation & Education */}
                <div className="space-y-2 mb-5">
                    {user.occupation && (
                        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{user.occupation}</span>
                        </div>
                    )}
                    {user.education && (
                        <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
                            <GraduationCap className="w-4 h-4 flex-shrink-0" />
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
                        <h3 className="text-xs font-medium text-[#9B9A97] uppercase tracking-wider mb-2">
                            My Vibe
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {user.tags.map((tag, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onContentClick?.(`tag-${idx}`, 'vibe')}
                                    className="px-3 py-1.5 text-sm bg-[#191919] text-[#E3E3E3] rounded-lg border border-[#2F2F2F] hover:border-[#505050] transition-colors"
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
                        <h3 className="text-xs font-medium text-[#9B9A97] uppercase tracking-wider mb-2">
                            About Me
                        </h3>
                        <p className="text-sm text-[#E3E3E3] leading-relaxed">
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
                                className="w-full text-left p-4 bg-[#191919] rounded-xl border border-[#2F2F2F] hover:border-[#505050] transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{prompt.emoji || '💬'}</span>
                                    <span className="text-xs font-medium text-[#9B9A97]">
                                        {prompt.question}
                                    </span>
                                </div>
                                <p className="text-sm text-[#E3E3E3]">{prompt.answer}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Spotify & Instagram */}
                <div className="flex items-center gap-4 text-xs text-[#9B9A97]">
                    {user.spotify && (
                        <div className="flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-green-400" />
                            <span className="truncate max-w-[120px]">
                                {user.spotify.song}
                            </span>
                        </div>
                    )}
                    {user.instagram && (
                        <div className="flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-pink-400" />
                            <span>{user.instagram}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
