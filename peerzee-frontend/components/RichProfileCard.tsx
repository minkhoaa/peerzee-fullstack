'use client';

import React, { forwardRef } from 'react';
import { MapPin, Briefcase, GraduationCap, Sparkles } from 'lucide-react';

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

// Generate gradient avatar based on name - ToyWorld colors
function getAvatarGradient(name: string): string {
    const gradients = [
        'from-[#CD6E67] to-[#E88B85]',
        'from-amber-400 to-orange-400',
        'from-emerald-400 to-teal-400',
        'from-blue-400 to-indigo-400',
        'from-violet-400 to-purple-400',
        'from-pink-400 to-rose-400',
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
                className="absolute inset-x-4 top-0 bg-white border-2 border-[#ECC8CD]/40 rounded-[40px] overflow-hidden shadow-xl shadow-[#CD6E67]/15"
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
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

                        {/* Name & Age - ToyWorld styled */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-3xl font-nunito font-bold text-[#3E3229]">
                                {user.display_name}
                                {user.age && <span className="font-normal text-[#7A6862] ml-2">{user.age}</span>}
                            </h2>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-3 mt-2">
                                {user.occupation && (
                                    <div className="flex items-center gap-1.5 text-sm text-[#7A6862]">
                                        <Briefcase className="w-3.5 h-3.5 text-[#CD6E67]" />
                                        <span>{user.occupation}</span>
                                    </div>
                                )}
                                {user.education && (
                                    <div className="flex items-center gap-1.5 text-sm text-[#7A6862]">
                                        <GraduationCap className="w-3.5 h-3.5 text-[#CD6E67]" />
                                        <span>{user.education}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Sections - ToyWorld styled */}
                    <div className="p-5 space-y-6 bg-white">
                        {/* My Vibe Section */}
                        {user.vibes && user.vibes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-[#CD6E67]" />
                                    <h3 className="text-xs font-bold text-[#7A6862] uppercase tracking-wider">
                                        My Vibe
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {user.vibes.map((vibe, index) => (
                                        <span
                                            key={index}
                                            className="px-4 py-2 bg-[#FDF0F1] text-[#CD6E67] text-sm rounded-full border-2 border-[#ECC8CD]/40 font-semibold"
                                        >
                                            {vibe}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* About Me - ToyWorld styled */}
                        {user.bio && (
                            <section>
                                <h3 className="text-xs font-bold text-[#7A6862] uppercase tracking-wider mb-3">
                                    About Me
                                </h3>
                                <p className="text-[#3E3229] text-sm leading-relaxed">
                                    {user.bio}
                                </p>
                            </section>
                        )}

                        {/* Prompts - ToyWorld Callout Style */}
                        {user.prompts && user.prompts.length > 0 && (
                            <section className="space-y-4">
                                {user.prompts.map((prompt, index) => (
                                    <div
                                        key={index}
                                        className="bg-[#FDF0F1] p-4 rounded-[20px] flex gap-3 border-2 border-[#ECC8CD]/40"
                                    >
                                        <span className="text-2xl flex-shrink-0">{prompt.emoji}</span>
                                        <div>
                                            <p className="text-sm font-bold text-[#3E3229] mb-1">
                                                {prompt.question}
                                            </p>
                                            <p className="text-sm text-[#7A6862]">
                                                {prompt.answer}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* Photo Grid - ToyWorld styled */}
                        {hasPhotos && user.photos.length > 1 && (
                            <section>
                                <h3 className="text-xs font-bold text-[#7A6862] uppercase tracking-wider mb-3">
                                    More Photos
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {user.photos.slice(1, 5).map((photo, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square rounded-[20px] overflow-hidden bg-[#FDF0F1] border-2 border-[#ECC8CD]/40"
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

                        {/* Location - ToyWorld styled */}
                        {(user.location || user.distance) && (
                            <section className="flex items-center gap-2 text-[#7A6862] pb-24">
                                <MapPin className="w-4 h-4 text-[#CD6E67]" />
                                <span className="text-sm font-medium">
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
