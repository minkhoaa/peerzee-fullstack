'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    MapPin, 
    Coffee, 
    Utensils, 
    Trees, 
    Wine,
    Navigation,
    Clock,
    ExternalLink,
    Star,
} from 'lucide-react';

interface DateSpot {
    id: string;
    name: string;
    type: 'cafe' | 'restaurant' | 'park' | 'bar' | 'other';
    address: string;
    coordinates: { lat: number; lng: number };
    distanceFromYou: number;
    distanceFromMatch: number;
    avgDistance: number;
    whyRecommended: string;
    openingHours?: string;
    googleMapsUrl: string;
}

interface DateSpotCardProps {
    spot: DateSpot;
    matchName?: string;
    onSelect?: (spot: DateSpot) => void;
    compact?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
    cafe: Coffee,
    restaurant: Utensils,
    park: Trees,
    bar: Wine,
    other: MapPin,
};

const typeColors: Record<string, string> = {
    cafe: 'bg-amber-100 text-amber-700 border-amber-300',
    restaurant: 'bg-rose-100 text-rose-700 border-rose-300',
    park: 'bg-green-100 text-green-700 border-green-300',
    bar: 'bg-purple-100 text-purple-700 border-purple-300',
    other: 'bg-gray-100 text-gray-700 border-gray-300',
};

const typeLabels: Record<string, string> = {
    cafe: 'Café',
    restaurant: 'Nhà hàng',
    park: 'Công viên',
    bar: 'Bar',
    other: 'Địa điểm',
};

/**
 * DateSpotCard - Card hiển thị gợi ý địa điểm hẹn hò
 * Pixel style matching Peerzee design
 */
export default function DateSpotCard({ spot, matchName, onSelect, compact = false }: DateSpotCardProps) {
    const Icon = typeIcons[spot.type] || MapPin;
    const colorClass = typeColors[spot.type] || typeColors.other;

    const handleOpenMaps = () => {
        if (spot.googleMapsUrl) {
            window.open(spot.googleMapsUrl, '_blank');
        }
    };

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-retro-white border-2 border-cocoa rounded-xl shadow-pixel-sm hover:shadow-pixel hover:-translate-y-0.5 transition-all cursor-pointer"
                onClick={() => onSelect?.(spot)}
            >
                <div className={`p-2 rounded-lg border-2 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-cocoa truncate">{spot.name}</p>
                    <p className="text-xs text-cocoa-light">{spot.avgDistance} km giữa 2 bạn</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); handleOpenMaps(); }}
                    className="p-1.5 text-cocoa-light hover:text-pixel-pink transition-colors"
                >
                    <Navigation className="w-4 h-4" />
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-retro-paper border-3 border-cocoa rounded-2xl shadow-pixel overflow-hidden"
        >
            {/* Header with type badge */}
            <div className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border-2 text-xs font-medium mb-2 ${colorClass}`}>
                            <Icon className="w-3 h-3" />
                            {typeLabels[spot.type]}
                        </div>
                        <h3 className="font-pixel text-lg text-cocoa leading-tight">{spot.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-pixel-yellow/30 rounded-lg border border-cocoa/20">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-medium text-cocoa">Gợi ý</span>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="px-4 flex items-start gap-2 text-sm text-cocoa-light">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{spot.address}</span>
            </div>

            {/* Why recommended */}
            {spot.whyRecommended && (
                <div className="px-4 mt-3">
                    <div className="p-3 bg-pixel-pink/10 rounded-xl border border-pixel-pink/30">
                        <p className="text-sm text-cocoa">💡 {spot.whyRecommended}</p>
                    </div>
                </div>
            )}

            {/* Distance info */}
            <div className="px-4 mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-retro-white/60 rounded-lg">
                    <p className="text-xs text-cocoa-light">Bạn</p>
                    <p className="font-medium text-cocoa">{spot.distanceFromYou} km</p>
                </div>
                <div className="p-2 bg-pixel-purple/10 rounded-lg border border-pixel-purple/30">
                    <p className="text-xs text-cocoa-light">Trung bình</p>
                    <p className="font-medium text-pixel-purple">{spot.avgDistance} km</p>
                </div>
                <div className="p-2 bg-retro-white/60 rounded-lg">
                    <p className="text-xs text-cocoa-light">{matchName || 'Match'}</p>
                    <p className="font-medium text-cocoa">{spot.distanceFromMatch} km</p>
                </div>
            </div>

            {/* Opening hours if available */}
            {spot.openingHours && (
                <div className="px-4 mt-2 flex items-center gap-2 text-xs text-cocoa-light">
                    <Clock className="w-3 h-3" />
                    <span>{spot.openingHours}</span>
                </div>
            )}

            {/* Actions */}
            <div className="p-4 mt-2 flex gap-2">
                <button
                    onClick={handleOpenMaps}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pixel-pink text-cocoa font-medium rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark active:translate-y-0.5 active:shadow-none transition-all"
                >
                    <Navigation className="w-4 h-4" />
                    Mở Maps
                </button>
                {onSelect && (
                    <button
                        onClick={() => onSelect(spot)}
                        className="px-4 py-2.5 bg-retro-white text-cocoa font-medium rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-cocoa/5 active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

/**
 * DateSpotList - List of date spot suggestions
 */
export function DateSpotList({ 
    spots, 
    matchName,
    onSelect,
    loading = false,
}: { 
    spots: DateSpot[];
    matchName?: string;
    onSelect?: (spot: DateSpot) => void;
    loading?: boolean;
}) {
    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-cocoa/10 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (spots.length === 0) {
        return (
            <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-cocoa-light/40 mx-auto mb-3" />
                <p className="text-sm text-cocoa-light">
                    Chưa có gợi ý địa điểm.<br />
                    Hãy đảm bảo cả 2 đã set vị trí trong profile!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {spots.map((spot, index) => (
                <DateSpotCard
                    key={spot.id}
                    spot={spot}
                    matchName={matchName}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
}
