'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ExternalLink, Heart } from 'lucide-react';
import type { DateIdea } from '@/hooks/useWingman';

interface DateIdeaCardProps {
    idea: DateIdea;
    index: number;
}

export default function DateIdeaCard({ idea, index }: DateIdeaCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.3 }}
            className="bg-retro-white border-3 border-cocoa rounded-2xl shadow-pixel p-4 hover:shadow-pixel-lg transition-shadow"
        >
            {/* Title */}
            <h3 className="font-pixel text-cocoa text-sm uppercase tracking-wide leading-tight mb-2">
                {idea.title}
            </h3>

            {/* Location: place name + address + Maps link */}
            {idea.location && (
                <div className="bg-pixel-pink/10 border-2 border-cocoa/20 rounded-xl p-2.5 mb-3">
                    <p className="text-cocoa font-bold text-sm mb-1">
                        {idea.location.place_name}
                    </p>
                    <div className="flex items-center gap-1.5 text-cocoa-light text-xs mb-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{idea.location.address}</span>
                    </div>
                    {idea.location.google_maps_url && (
                        <a
                            href={idea.location.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pixel-blue/20 hover:bg-pixel-blue/30 border-2 border-cocoa/30 rounded-lg text-xs font-bold text-cocoa transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Xem trên Google Maps
                        </a>
                    )}
                </div>
            )}

            {/* Description */}
            <p className="text-cocoa text-sm leading-relaxed mb-2">
                {idea.description}
            </p>

            {/* Why it matches */}
            {idea.why_it_matches && (
                <div className="flex items-start gap-1.5 text-xs text-cocoa-light">
                    <Heart className="w-3 h-3 shrink-0 mt-0.5 text-pixel-red" />
                    <span>{idea.why_it_matches}</span>
                </div>
            )}
        </motion.div>
    );
}
