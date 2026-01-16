'use client';

import React, { forwardRef } from 'react';
import { MapPin, Briefcase, GraduationCap } from 'lucide-react';

// Types
export interface UserProfile {
    id: string;
    display_name: string;
    age?: number;
    bio?: string;
    location?: string;
    distance?: string;
    occupation?: string;
    education?: string;
    photos: string[];
    vibes: string[];
    prompts: {
        emoji: string;
        question: string;
        answer: string;
    }[];
}

interface RichProfileCardProps {
    user: UserProfile;
    style?: React.CSSProperties;
}

// Generate gradient avatar based on name
function getAvatarGradient(name: string): string {
    const gradients = [
        'from-blue-500 to-purple-600',
        'from-pink-500 to-rose-500',
        'from-emerald-500 to-teal-500',
        'from-orange-500 to-amber-500',
        'from-indigo-500 to-blue-500',
        'from-violet-500 to-purple-500',
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
}

const RichProfileCard = forwardRef<HTMLDivNode, RichProfileCardProps>(
    ({ user, style }, ref) => {
        const hasPhotos = user.photos && user.photos.length > 0;
        const gradient = getAvatarGradient(user.display_name);

        return (
            <div
                ref={ref as React.Ref<HTMLDivElement>}
                style={style}
                className="absolute inset-x-4 top-0 bg-[#202020] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl"
            >
                {/* Scrollable Content Container */}
                <div className="h-[75vh] overflow-y-auto scrollbar-hide">
                    {/* Main Photo Section */}
                    <div className="relative aspect-[3/4] w-full">
                        {hasPhotos ? (
                            <img
                                src={user.photos[0]}
                                alt={user.display_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                <span className="text-8xl font-bold text-white/90">
                                    {user.display_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Gradient overlay for name */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#202020] to-transparent" />

                        {/* Name & Age */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-3xl font-semibold text-[#E3E3E3]">
                                {user.display_name}
                                {user.age && <span className="font-normal text-[#9B9A97] ml-2">{user.age}</span>}
                            </h2>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-3 mt-2">
                                {user.occupation && (
                                    <div className="flex items-center gap-1.5 text-sm text-[#9B9A97]">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        <span>{user.occupation}</span>
                                    </div>
                                )}
                                {user.education && (
                                    <div className="flex items-center gap-1.5 text-sm text-[#9B9A97]">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        <span>{user.education}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="p-5 space-y-6">
                        {/* My Vibe Section */}
                        {user.vibes && user.vibes.length > 0 && (
                            <section>
                                <h3 className="text-xs font-medium text-[#9B9A97] uppercase tracking-wider mb-3">
                                    My Vibe
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.vibes.map((vibe, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-[#2F2F2F] text-[#E3E3E3] text-sm rounded-full border border-[#3A3A3A]"
                                        >
                                            {vibe}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About Me */}
                        {user.bio && (
                            <section>
                                <h3 className="text-xs font-medium text-[#9B9A97] uppercase tracking-wider mb-3">
                                    About Me
                                </h3>
                                <p className="text-[#E3E3E3] text-sm leading-relaxed">
                                    {user.bio}
                                </p>
                            </section>
                        )}

                        {/* Prompts - Notion Callout Style */}
                        {user.prompts && user.prompts.length > 0 && (
                            <section className="space-y-4">
                                {user.prompts.map((prompt, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#262626] p-4 rounded-lg flex gap-3 border border-[#333333]"
                                    >
                                        <span className="text-2xl flex-shrink-0">{prompt.emoji}</span>
                                        <div>
                                            <p className="text-sm font-medium text-[#E3E3E3] mb-1">
                                                {prompt.question}
                                            </p>
                                            <p className="text-sm text-[#9B9A97]">
                                                {prompt.answer}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* Photo Grid */}
                        {hasPhotos && user.photos.length > 1 && (
                            <section>
                                <h3 className="text-xs font-medium text-[#9B9A97] uppercase tracking-wider mb-3">
                                    More Photos
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {user.photos.slice(1, 5).map((photo, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square rounded-lg overflow-hidden bg-[#2F2F2F]"
                                        >
                                            <img
                                                src={photo}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Location */}
                        {(user.location || user.distance) && (
                            <section className="flex items-center gap-2 text-[#9B9A97] pb-24">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">
                                    {user.distance || user.location}
                                </span>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);

RichProfileCard.displayName = 'RichProfileCard';

export default RichProfileCard;

// Type fix for ref
type HTMLDivNode = HTMLDivElement;
