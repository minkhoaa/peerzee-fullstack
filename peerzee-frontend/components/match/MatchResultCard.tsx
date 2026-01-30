'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Heart, RefreshCw, Video, MessageSquare, MapPin, Sparkles } from 'lucide-react';
import { getAssetUrl } from '@/lib/api';

interface UserProfile {
    id: string;
    display_name: string;
    avatar_url?: string;
    age?: number;
    location?: string;
    bio?: string;
    interests?: string[];
}

interface MatchResultCardProps {
    profile: UserProfile;
    reasoning: string;
    matchScore?: number;
    onConnect: () => void;
    onReroll: () => void;
}

/**
 * MatchResultCard - Display matched profile with AI reasoning
 * Shows the "Top Secret File" style result with RAG explanation
 */
export function MatchResultCard({ profile, reasoning, matchScore = 95, onConnect, onReroll }: MatchResultCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel-lg overflow-hidden max-w-md mx-auto"
        >
            {/* Header - Top Secret Style */}
            <div className="bg-pixel-yellow border-b-3 border-cocoa px-4 py-3 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cocoa" fill="currentColor" />
                        <span className="font-pixel text-sm text-cocoa uppercase tracking-wider">
                            MATCH FOUND
                        </span>
                    </div>
                    <div className="font-pixel text-xs text-cocoa">
                        {matchScore}% MATCH
                    </div>
                </div>
                {/* Stamp Effect */}
                <div className="absolute top-2 right-2 opacity-20">
                    <div className="border-2 border-pixel-red rounded-lg px-2 py-1 rotate-12">
                        <span className="font-pixel text-xs text-pixel-red">CLASSIFIED</span>
                    </div>
                </div>
            </div>

            {/* Profile Section */}
            <div className="p-6">
                {/* Avatar and Basic Info */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                        {profile.avatar_url ? (
                            <img
                                src={getAssetUrl(profile.avatar_url)}
                                alt={profile.display_name}
                                className="w-20 h-20 rounded-lg border-3 border-cocoa object-cover shadow-pixel-sm"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-lg border-3 border-cocoa bg-pixel-purple flex items-center justify-center shadow-pixel-sm">
                                <User className="w-10 h-10 text-cocoa" />
                            </div>
                        )}
                        {/* Level Badge */}
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-pixel-pink border-2 border-cocoa flex items-center justify-center shadow-pixel-sm">
                            <span className="font-pixel text-xs text-cocoa">L5</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="font-pixel text-xl text-cocoa mb-1">
                            {profile.display_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-cocoa-light font-bold mb-2">
                            {profile.age && <span>{profile.age} tuổi</span>}
                            {profile.location && (
                                <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{profile.location}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        {profile.bio && (
                            <p className="text-xs text-cocoa-light font-bold line-clamp-2">
                                {profile.bio}
                            </p>
                        )}
                    </div>
                </div>

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {profile.interests.map((interest, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 bg-pixel-blue/20 border border-cocoa text-cocoa text-xs font-bold rounded"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                )}

                {/* AI Analysis Section */}
                <div className="bg-pixel-green/10 border-2 border-pixel-green rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-pixel-green" />
                        <span className="font-pixel text-xs text-cocoa uppercase tracking-wider">
                            AI ANALYSIS
                        </span>
                    </div>
                    <p className="text-sm text-cocoa leading-relaxed font-bold">
                        {reasoning}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onConnect}
                        className="flex-1 bg-pixel-pink border-3 border-cocoa rounded-lg px-4 py-3 font-pixel text-sm text-cocoa uppercase tracking-wider hover:bg-pixel-pink-dark transition-all shadow-pixel active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                    >
                        <Heart className="w-4 h-4" fill="currentColor" />
                        CONNECT
                    </button>
                    <button
                        onClick={onReroll}
                        className="flex-1 bg-retro-white border-3 border-cocoa rounded-lg px-4 py-3 font-pixel text-sm text-cocoa-light uppercase tracking-wider hover:bg-pixel-yellow transition-all shadow-pixel active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        REROLL
                    </button>
                </div>

                {/* Connection Options */}
                <div className="mt-3 flex gap-2 justify-center">
                    <button className="p-2 border-2 border-cocoa rounded-lg hover:bg-pixel-blue/20 transition-colors">
                        <Video className="w-4 h-4 text-cocoa" />
                    </button>
                    <button className="p-2 border-2 border-cocoa rounded-lg hover:bg-pixel-blue/20 transition-colors">
                        <MessageSquare className="w-4 h-4 text-cocoa" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
