'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { LevelBadgeInline } from './LevelBadge';

// Dynamic imports for optional dependencies
let toPng: any = null;
let QRCodeSVG: any = null;

// Try to load optional deps
if (typeof window !== 'undefined') {
    // @ts-ignore - optional dependency
    import('html-to-image').then((mod) => { toPng = mod.toPng; }).catch(() => {});
    // @ts-ignore - optional dependency  
    import('qrcode.react').then((mod) => { QRCodeSVG = mod.QRCodeSVG; }).catch(() => {});
}

interface ShareProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: {
        id: string;
        displayName: string;
        age?: number;
        bio?: string;
        photos?: { url: string }[];
        tags?: string[];
        level: number;
        occupation?: string;
    };
}

// Retro pixel art frame colors
const FRAME_COLORS = [
    { primary: '#F4B0C8', secondary: '#D77FA1', name: 'Pink' },
    { primary: '#98D689', secondary: '#5DA94B', name: 'Green' },
    { primary: '#7EC8E3', secondary: '#4A9CC7', name: 'Blue' },
    { primary: '#DDA0DD', secondary: '#B76EB8', name: 'Purple' },
    { primary: '#FFD93D', secondary: '#D4A017', name: 'Gold' },
];

export default function ShareProfileModal({
    isOpen,
    onClose,
    profile,
}: ShareProfileModalProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState(0);

    const frame = FRAME_COLORS[selectedFrame];
    const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profile.id}`;
    const avatarUrl = profile.photos?.[0]?.url || '/default-avatar.png';

    const handleDownload = async () => {
        if (!cardRef.current || !toPng) {
            alert('Download feature loading, please try again.');
            return;
        }
        
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
                backgroundColor: '#FFF9F5',
            });
            
            const link = document.createElement('a');
            link.download = `peerzee-${profile.displayName}-card.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
        }
        setIsGenerating(false);
    };

    const handleShare = async () => {
        if (!cardRef.current || !toPng) {
            // Fallback: just copy link
            await handleCopyLink();
            return;
        }
        
        setIsGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });

            // Convert to blob for Web Share API
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `peerzee-${profile.displayName}-card.png`, {
                type: 'image/png',
            });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `${profile.displayName} on Peerzee`,
                    text: `Check out my Peerzee profile! 💕`,
                    files: [file],
                });
            } else {
                // Fallback: copy link
                await navigator.clipboard.writeText(profileUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to share:', err);
        }
        setIsGenerating(false);
    };

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-retro-paper rounded-2xl border-4 border-cocoa shadow-pixel-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b-2 border-cocoa/20">
                        <h2 className="font-pixel text-lg text-cocoa">Share Profile Card</h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-cocoa/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-cocoa" />
                        </button>
                    </div>

                    {/* Frame Color Selector */}
                    <div className="px-4 pt-4">
                        <p className="text-xs text-cocoa-light mb-2">Choose frame color:</p>
                        <div className="flex gap-2">
                            {FRAME_COLORS.map((color, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedFrame(i)}
                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                        selectedFrame === i 
                                            ? 'border-cocoa scale-110 shadow-pixel-sm' 
                                            : 'border-cocoa/30 hover:border-cocoa/60'
                                    }`}
                                    style={{ backgroundColor: color.primary }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Card Preview */}
                    <div className="p-4">
                        <div
                            ref={cardRef}
                            className="relative bg-retro-paper rounded-xl overflow-hidden"
                            style={{
                                border: `6px solid ${frame.primary}`,
                                boxShadow: `0 4px 0 ${frame.secondary}`,
                            }}
                        >
                            {/* Pixel Pattern Top */}
                            <div 
                                className="h-3"
                                style={{
                                    background: `repeating-linear-gradient(
                                        90deg,
                                        ${frame.primary} 0px,
                                        ${frame.primary} 8px,
                                        ${frame.secondary} 8px,
                                        ${frame.secondary} 16px
                                    )`,
                                }}
                            />

                            {/* Card Content */}
                            <div className="p-4">
                                {/* Avatar & Basic Info */}
                                <div className="flex gap-4 items-start">
                                    <div 
                                        className="w-24 h-24 rounded-lg border-4 overflow-hidden flex-shrink-0"
                                        style={{ borderColor: frame.secondary }}
                                    >
                                        <img
                                            src={avatarUrl}
                                            alt={profile.displayName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-pixel text-lg text-cocoa truncate">
                                                {profile.displayName}
                                            </h3>
                                            {profile.age && (
                                                <span className="text-sm text-cocoa-light">
                                                    {profile.age}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <LevelBadgeInline level={profile.level} />
                                        
                                        {profile.occupation && (
                                            <p className="text-xs text-cocoa-light mt-2 truncate">
                                                {profile.occupation}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                {profile.bio && (
                                    <div 
                                        className="mt-4 p-3 rounded-lg text-sm text-cocoa"
                                        style={{ backgroundColor: `${frame.primary}30` }}
                                    >
                                        "{profile.bio.substring(0, 100)}{profile.bio.length > 100 ? '...' : ''}"
                                    </div>
                                )}

                                {/* Tags */}
                                {profile.tags && profile.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {profile.tags.slice(0, 5).map((tag, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 text-xs rounded-full border"
                                                style={{
                                                    backgroundColor: `${frame.primary}20`,
                                                    borderColor: frame.primary,
                                                    color: frame.secondary,
                                                }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* QR Code & Logo */}
                                <div className="flex items-end justify-between mt-4 pt-3 border-t-2 border-dashed border-cocoa/20">
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="p-1.5 rounded-lg"
                                            style={{ backgroundColor: `${frame.primary}30` }}
                                        >
                                            {QRCodeSVG ? (
                                                <QRCodeSVG
                                                    value={profileUrl}
                                                    size={48}
                                                    bgColor="transparent"
                                                    fgColor={frame.secondary}
                                                    level="L"
                                                />
                                            ) : (
                                                <div 
                                                    className="w-12 h-12 flex items-center justify-center text-[8px] text-cocoa-light border border-cocoa/20 rounded"
                                                >
                                                    QR
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-cocoa-light">
                                            <p>Scan to view profile</p>
                                            <p className="font-pixel" style={{ color: frame.secondary }}>
                                                peerzee.app
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Peerzee Logo */}
                                    <div className="text-right">
                                        <p className="font-pixel text-lg" style={{ color: frame.secondary }}>
                                            Peerzee
                                        </p>
                                        <p className="text-[10px] text-cocoa-light">
                                            Find Your Vibe 💕
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pixel Pattern Bottom */}
                            <div 
                                className="h-3"
                                style={{
                                    background: `repeating-linear-gradient(
                                        90deg,
                                        ${frame.secondary} 0px,
                                        ${frame.secondary} 8px,
                                        ${frame.primary} 8px,
                                        ${frame.primary} 16px
                                    )`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 pt-0 space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pixel-pink text-cocoa font-pixel text-sm rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark disabled:opacity-50 transition-all active:translate-y-0.5 active:shadow-none"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            
                            <button
                                onClick={handleShare}
                                disabled={isGenerating}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pixel-blue text-cocoa font-pixel text-sm rounded-xl border-2 border-cocoa shadow-pixel-sm hover:bg-pixel-blue/80 disabled:opacity-50 transition-all active:translate-y-0.5 active:shadow-none"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>

                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-retro-white text-cocoa text-sm rounded-xl border-2 border-cocoa/30 hover:border-cocoa hover:bg-cocoa/5 transition-all"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy Profile Link
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
