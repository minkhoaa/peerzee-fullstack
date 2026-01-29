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

// Get pixel-style avatar background
function getAvatarBg(name: string): string {
    const colors = [
        'bg-pixel-blue',
        'bg-pixel-pink',
        'bg-pixel-green',
        'bg-pixel-yellow',
        'bg-pixel-purple',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

/**
 * RichProfileCard - Retro Pixel OS styled full profile card
 */
const RichProfileCard = forwardRef<HTMLDivNode, RichProfileCardProps>(
    ({ user, style }, ref) => {
        const hasPhotos = user.photos && user.photos.length > 0;
        const avatarBg = getAvatarBg(user.display_name);

        return (
            <div
                ref={ref as React.Ref<HTMLDivElement>}
                style={style}
                className="absolute inset-x-4 top-0 bg-retro-white border-3 border-cocoa rounded-xl overflow-hidden shadow-pixel"
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
                            <div className={`w-full h-full ${avatarBg} flex items-center justify-center`}>
                                <span className="text-8xl font-pixel text-cocoa">
                                    {user.display_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}

                        {/* Gradient overlay for name */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-retro-white to-transparent" />

                        {/* Name & Age */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-3xl font-pixel uppercase tracking-widest text-cocoa">
                                {user.display_name}
                                {user.age && <span className="font-bold text-cocoa-light ml-2">{user.age}</span>}
                            </h2>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-3 mt-2">
                                {user.occupation && (
                                    <div className="flex items-center gap-1.5 text-sm text-cocoa font-bold">
                                        <Briefcase className="w-3.5 h-3.5 text-pixel-pink" />
                                        <span>{user.occupation}</span>
                                    </div>
                                )}
                                {user.education && (
                                    <div className="flex items-center gap-1.5 text-sm text-cocoa font-bold">
                                        <GraduationCap className="w-3.5 h-3.5 text-pixel-purple" />
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
                                <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa mb-3">
                                    My Vibe
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.vibes.map((vibe, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-pixel-yellow text-cocoa text-sm font-bold rounded-lg border-2 border-cocoa shadow-pixel-sm"
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
                                <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa mb-3">
                                    About Me
                                </h3>
                                <p className="text-cocoa text-sm font-medium leading-relaxed">
                                    {user.bio}
                                </p>
                            </section>
                        )}

                        {/* Prompts - Pixel Style */}
                        {user.prompts && user.prompts.length > 0 && (
                            <section className="space-y-4">
                                {user.prompts.map((prompt, index) => (
                                    <div
                                        key={index}
                                        className="bg-retro-paper p-4 rounded-xl flex gap-3 border-2 border-cocoa shadow-pixel-sm"
                                    >
                                        <span className="text-2xl flex-shrink-0">{prompt.emoji}</span>
                                        <div>
                                            <p className="text-sm font-pixel uppercase tracking-widest text-cocoa-light mb-1">
                                                {prompt.question}
                                            </p>
                                            <p className="text-sm text-cocoa font-bold">
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
                                <h3 className="text-xs font-pixel uppercase tracking-widest text-cocoa mb-3">
                                    More Photos
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {user.photos.slice(1, 5).map((photo, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square rounded-xl overflow-hidden bg-retro-paper border-2 border-cocoa shadow-pixel-sm"
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
                            <section className="flex items-center gap-2 text-cocoa pb-24">
                                <MapPin className="w-4 h-4 text-pixel-pink" />
                                <span className="text-sm font-bold">
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
