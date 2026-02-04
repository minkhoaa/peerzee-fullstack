'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, Trash2, Loader2, MapPin, Ruler, Music, Play, Pause, Frown, FileText, Image, User, Briefcase, Tag, PenLine, Star, Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileApi, getAssetUrl, ProfileAnalysisResult } from '@/lib/api';
import { searchLocations } from '@/lib/vietnam-locations';
import { TagSelector } from '@/components/TagSelector';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { MusicSearchModal } from '@/components/profile/MusicSearchModal';
import ProfilePhotos from '@/components/profile/ProfilePhotos';
import { ZODIAC_SIGNS, getTagDisplay } from '@/lib/profile-tags';

interface MusicData {
    trackId?: string;
    song: string;
    artist: string;
    cover: string;
    previewUrl?: string;
    analysis?: {
        mood: string;
        color: string;
        keywords: string[];
        description: string;
    };
}

interface UserProfile {
    id: string;
    email?: string;
    display_name?: string;
    bio?: string;
    location?: string;
    age?: number;
    height?: number;
    zodiac?: string;
    occupation?: string;
    education?: string;
    tags?: string[];
    photos?: { id: string; url: string; order?: number; isCover?: boolean }[];
    spotify?: MusicData | { song: string; artist: string } | null;
}

export default function MyProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ matches: 0, likes: 0, views: 0 });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        location: '',
        occupation: '',
        height: '',
        zodiac: '',
        tags: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [locationQuery, setLocationQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'photos'>('photos');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMusicModalOpen, setMusicModalOpen] = useState(false);
    const [isEditingPhotos, setIsEditingPhotos] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<ProfileAnalysisResult | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Toggle audio playback
    const togglePlay = (previewUrl?: string) => {
        if (!previewUrl) return;

        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current || audioRef.current.src !== previewUrl) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                audioRef.current = new Audio(previewUrl);
                audioRef.current.volume = 0.5;
                audioRef.current.onended = () => setIsPlaying(false);
                audioRef.current.onerror = () => setIsPlaying(false);
            }
            audioRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadProfile();
        loadStats();
    }, [router]);

    const loadProfile = async () => {
        try {
            console.log('[Profile] Loading profile...');
            const res = await profileApi.getMyProfile();
            const p: UserProfile = res.data;
            console.log('[Profile] Loaded:', p);
            console.log('[Profile] Photos:', p.photos);
            setProfile(p);
            setEditForm({
                display_name: p.display_name || '',
                bio: p.bio || '',
                location: p.location || '',
                occupation: p.occupation || '',
                height: p.height?.toString() || '',
                zodiac: p.zodiac || '',
                tags: p.tags || [],
            });
        } catch (err) {
            console.error('Failed to load profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const res = await profileApi.getStats();
            setStats(res.data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updateData = {
                display_name: editForm.display_name,
                bio: editForm.bio,
                location: editForm.location,
                occupation: editForm.occupation,
                height: editForm.height ? parseInt(editForm.height, 10) : undefined,
                zodiac: editForm.zodiac || undefined,
                tags: editForm.tags,
            };
            const res = await profileApi.updateProfile(updateData);
            setProfile(res.data);
            setShowEditModal(false);
        } catch (err) {
            console.error('Failed to save:', err);
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        console.log('[Photo Upload] Starting upload:', file.name);
        setUploading(true);
        try {
            const photos = profile?.photos || [];
            const res = await profileApi.uploadPhoto(file, photos.length === 0);
            console.log('[Photo Upload] Success:', res.data);
            setProfile(res.data);
        } catch (err) {
            console.error('[Photo Upload] Failed:', err);
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Upload cover photo specifically (always set as cover)
    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        console.log('[Cover Upload] Starting upload:', file.name, file.size);
        setUploading(true);
        try {
            const res = await profileApi.uploadPhoto(file, true); // Always set as cover
            console.log('[Cover Upload] Success, new profile:', res.data);
            setProfile(res.data);
        } catch (err) {
            console.error('[Cover Upload] Failed:', err);
        } finally {
            setUploading(false);
            // Reset input to allow re-upload of same file
            if (coverInputRef.current) {
                coverInputRef.current.value = '';
            }
        }
    };

    const handlePhotoUploadFile = async (file: File): Promise<void> => {
        setUploading(true);
        try {
            const res = await profileApi.uploadPhoto(file, !profile?.photos || profile.photos.length === 0);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to upload:', err);
            throw err;
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId: string): Promise<void> => {
        try {
            const res = await profileApi.deletePhoto(photoId);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to delete:', err);
            throw err;
        }
    };

    const handleSelectMusic = async (music: MusicData) => {
        try {
            // Update profile state immediately for instant feedback
            setProfile(prev => prev ? { ...prev, spotify: music } : null);
            setMusicModalOpen(false);
        } catch (err) {
            console.error('Failed to set music:', err);
        }
    };

    const handleAIAnalyze = async () => {
        setAiAnalyzing(true);
        setAiResult(null);
        try {
            const res = await profileApi.analyzeProfile();
            setAiResult(res.data);
        } catch (err) {
            console.error('Failed to analyze profile:', err);
        } finally {
            setAiAnalyzing(false);
        }
    };

    const calculateStrength = () => {
        if (!profile) return 0;
        let score = 0;
        if (profile.photos && profile.photos.length > 0) score += 40;
        if (profile.bio) score += 30;
        if (profile.tags && profile.tags.length > 0) score += 20;
        if (profile.location) score += 10;
        return Math.min(score, 100);
    };

    const strength = calculateStrength();

    if (loading) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <Loader2 className="w-10 h-10 text-cocoa animate-spin" strokeWidth={2.5} />
                    </div>
                    <p className="font-pixel text-cocoa uppercase tracking-widest">LOADING...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center gap-4">
                <div className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-pixel-red/20 border-3 border-cocoa rounded-xl flex items-center justify-center">
                        <Frown className="w-8 h-8 text-cocoa" strokeWidth={2.5} />
                    </div>
                    <p className="font-pixel text-cocoa uppercase tracking-widest mb-4">PROFILE NOT FOUND</p>
                    <button
                        onClick={() => router.push('/discover')}
                        className="font-pixel text-sm text-cocoa uppercase tracking-wider px-4 py-2 bg-pixel-pink border-3 border-cocoa rounded-lg shadow-pixel-sm hover:bg-pixel-pink-dark active:translate-y-0.5 active:shadow-none transition-all"
                    >
                        ← GO BACK
                    </button>
                </div>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    // Find cover photo: first look for isCover=true, then fallback to first photo
    const coverPhotoObj = photos.find(p => p.isCover) || photos[0];
    const coverPhoto = getAssetUrl(coverPhotoObj?.url);
    const avatarUrl = getAssetUrl(coverPhotoObj?.url);

    const musicData = profile.spotify && 'cover' in profile.spotify
        ? profile.spotify as MusicData
        : profile.spotify
            ? { ...profile.spotify, cover: '', previewUrl: undefined }
            : null;

    return (
        <div className="min-h-screen bg-retro-bg px-4 py-8 flex flex-col items-center gap-8">
            {/* Hidden file input for general photo upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
            />

            {/* Hidden file input for cover photo upload */}
            <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
            />

            {/* Container */}
            <div className="max-w-5xl w-full space-y-8">
                {/* Hero Card */}
                <ProfileHero
                    coverPhoto={coverPhoto}
                    avatarUrl={avatarUrl}
                    displayName={profile.display_name || 'Unknown'}
                    username={profile.display_name?.toLowerCase().replace(/\s/g, '') || 'user'}
                    bio={profile.bio}
                    stats={stats}
                    uploading={uploading}
                    onEditClick={() => setShowEditModal(true)}
                    onCoverUploadClick={() => coverInputRef.current?.click()}
                    onAvatarUploadClick={() => coverInputRef.current?.click()}
                />

                {/* Retro Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {/* Vinyl Player Widget - Enhanced Vinyl Disc Style */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setMusicModalOpen(true)}
                        className="bg-retro-white p-6 border-3 border-cocoa rounded-xl shadow-pixel flex items-center gap-5 cursor-pointer hover:translate-y-[-2px] hover:shadow-pixel-lg transition-all"
                    >
                        {musicData ? (
                            <>
                                {/* Vinyl Disc Container */}
                                <div className="relative w-20 h-20 shrink-0">
                                    {/* Outer glow when playing */}
                                    {isPlaying && (
                                        <motion.div
                                            className="absolute inset-[-4px] rounded-full"
                                            style={{
                                                background: musicData.analysis?.color
                                                    ? `radial-gradient(circle, ${musicData.analysis.color}40 0%, transparent 70%)`
                                                    : 'radial-gradient(circle, rgba(157,214,157,0.3) 0%, transparent 70%)'
                                            }}
                                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                                        />
                                    )}

                                    {/* Vinyl Disc */}
                                    <motion.div
                                        animate={{ rotate: isPlaying ? 360 : 0 }}
                                        transition={{
                                            duration: 4,
                                            repeat: isPlaying ? Infinity : 0,
                                            ease: "linear"
                                        }}
                                        className="w-20 h-20 rounded-full relative overflow-hidden border-3 border-cocoa"
                                        style={{
                                            boxShadow: isPlaying
                                                ? `0 4px 20px ${musicData.analysis?.color || 'rgba(157,214,157,0.4)'}`
                                                : '2px 2px 0px #62544B'
                                        }}
                                    >
                                        {/* Album art as vinyl surface */}
                                        {musicData.cover ? (
                                            <img src={musicData.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center"
                                                style={{
                                                    background: musicData.analysis?.color
                                                        ? `linear-gradient(135deg, ${musicData.analysis.color} 0%, ${musicData.analysis.color}88 100%)`
                                                        : 'linear-gradient(135deg, #9DD69D 0%, #7BC47B 100%)'
                                                }}
                                            >
                                                <Music className="w-8 h-8 text-white/60" />
                                            </div>
                                        )}

                                        {/* Vinyl grooves overlay */}
                                        <div
                                            className="absolute inset-0 rounded-full pointer-events-none"
                                            style={{
                                                background: `repeating-radial-gradient(
                                                    circle at center,
                                                    transparent 0px,
                                                    transparent 3px,
                                                    rgba(0,0,0,0.12) 3px,
                                                    rgba(0,0,0,0.12) 4px
                                                )`,
                                            }}
                                        />

                                        {/* Center hole */}
                                        <div
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-retro-white/95 border-2 border-cocoa flex items-center justify-center backdrop-blur-sm"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-cocoa/30" />
                                        </div>
                                    </motion.div>

                                    {/* Play/Pause Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            togglePlay(musicData?.previewUrl);
                                        }}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-pixel-pink border-2 border-cocoa rounded-full flex items-center justify-center text-cocoa shadow-pixel-sm hover:bg-pixel-pink-dark active:translate-y-0.5 active:shadow-none transition-all z-10"
                                    >
                                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                    </button>
                                </div>

                                {/* Track Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-body font-bold text-cocoa truncate text-sm flex items-center gap-1.5">
                                        <Music className="w-3.5 h-3.5 flex-shrink-0 text-pixel-pink-dark" strokeWidth={2.5} />
                                        {musicData.song}
                                    </p>
                                    <p className="font-body text-cocoa-light text-xs truncate font-bold mt-0.5">
                                        {musicData.artist}
                                    </p>
                                    {musicData.analysis?.mood && (
                                        <span
                                            className="inline-flex mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold border border-cocoa text-cocoa"
                                            style={{ backgroundColor: `${musicData.analysis.color}66` }}
                                        >
                                            {musicData.analysis.mood}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Empty vinyl placeholder */}
                                <div className="w-20 h-20 rounded-full bg-retro-bg border-3 border-dashed border-cocoa-light flex items-center justify-center relative">
                                    <div className="w-6 h-6 rounded-full border-2 border-dashed border-cocoa-light" />
                                    <Music className="absolute w-6 h-6 text-cocoa-light" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-pixel text-cocoa uppercase tracking-wider text-sm">NO MUSIC</p>
                                    <p className="font-body text-cocoa-light text-xs font-bold mt-1">Thêm bài hát yêu thích của bạn</p>
                                </div>
                            </>
                        )}
                    </motion.div>


                    {/* Interest Tags (Pixel Badges) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-retro-white p-6 border-3 border-cocoa rounded-xl shadow-pixel col-span-1 md:col-span-2 flex flex-wrap gap-3 items-center"
                    >
                        <span className="font-pixel text-pixel-pink-dark uppercase tracking-wider mr-2 flex items-center gap-1"><Tag className="w-4 h-4" strokeWidth={2.5} /> LOVES:</span>
                        {profile.tags && profile.tags.length > 0 ? (
                            profile.tags.map((tag, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    className="bg-pixel-yellow text-cocoa px-4 py-2 rounded-lg font-body font-bold border-3 border-cocoa shadow-pixel-sm cursor-default"
                                >
                                    {tag}
                                </motion.span>
                            ))
                        ) : (
                            <span className="font-body text-cocoa-light font-bold text-sm">No interests added yet</span>
                        )}
                    </motion.div>

                    {/* AI Profile Doctor Widget */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-pixel-blue/20 to-pixel-pink/20 p-6 border-3 border-cocoa rounded-xl shadow-pixel col-span-1 md:col-span-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-pixel-purple border-3 border-cocoa rounded-xl shadow-pixel flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-cocoa" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="font-pixel text-cocoa uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                                        AI Profile Doctor
                                    </h3>
                                    <p className="text-xs text-cocoa-light font-body font-bold mt-1">
                                        Nhận phản hồi chân thực và lời khuyên cải thiện profile
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAIModal(true);
                                    if (!aiResult) {
                                        handleAIAnalyze();
                                    }
                                }}
                                className="px-6 py-3 bg-pixel-purple text-cocoa border-3 border-cocoa rounded-lg shadow-pixel hover:bg-purple-400 active:translate-y-0.5 active:shadow-none transition-all font-pixel uppercase tracking-wider whitespace-nowrap"
                            >
                                Phân tích
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Content Tabs & Grid */}
                <div className="w-full space-y-6">
                    {/* Tab Switcher - Retro Style */}
                    <div className="flex justify-center">
                        <div className="bg-retro-white p-2 border-3 border-cocoa rounded-xl shadow-pixel inline-flex gap-2">
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`px-6 py-3 rounded-lg font-pixel uppercase tracking-wider transition-all border-3 ${activeTab === 'photos'
                                    ? 'bg-pixel-pink border-cocoa shadow-pixel-sm text-cocoa'
                                    : 'bg-transparent border-transparent text-cocoa-light hover:border-cocoa hover:bg-retro-bg'
                                    } active:translate-y-0.5 active:shadow-none`}
                            >
                                <Image className="w-4 h-4 inline-block mr-1" strokeWidth={2.5} /> PHOTOS
                            </button>
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-6 py-3 rounded-lg font-pixel uppercase tracking-wider transition-all border-3 ${activeTab === 'posts'
                                    ? 'bg-pixel-pink border-cocoa shadow-pixel-sm text-cocoa'
                                    : 'bg-transparent border-transparent text-cocoa-light hover:border-cocoa hover:bg-retro-bg'
                                    } active:translate-y-0.5 active:shadow-none`}
                            >
                                <FileText className="w-4 h-4 inline-block mr-1" strokeWidth={2.5} /> POSTS
                            </button>
                        </div>
                    </div>

                    {/* Photo Grid */}
                    {activeTab === 'photos' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {/* Edit Toggle Button - Retro Style */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                                    className={`px-6 py-2 rounded-lg font-pixel uppercase tracking-wider transition-all border-3 border-cocoa ${isEditingPhotos
                                        ? 'bg-pixel-green text-cocoa shadow-pixel-sm'
                                        : 'bg-retro-white text-cocoa hover:bg-pixel-blue hover:shadow-pixel-sm'
                                        } active:translate-y-0.5 active:shadow-none`}
                                >
                                    {isEditingPhotos ? '✓ DONE' : <><PenLine className="w-4 h-4 inline" strokeWidth={2.5} /> EDIT</>}
                                </button>
                            </div>

                            {/* ProfilePhotos Component */}
                            <ProfilePhotos
                                photos={photos}
                                isOwnProfile={true}
                                isEditing={isEditingPhotos}
                                onUpload={handlePhotoUploadFile}
                                onDelete={handleDeletePhoto}
                            />
                        </motion.div>
                    )}

                    {/* Posts Tab (Empty State) - Retro Style */}
                    {activeTab === 'posts' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel p-12 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 bg-pixel-blue/20 border-3 border-cocoa rounded-xl flex items-center justify-center">
                                <FileText className="w-8 h-8 text-cocoa" strokeWidth={2.5} />
                            </div>
                            <p className="font-pixel text-cocoa uppercase tracking-widest">NO POSTS YET</p>
                            <p className="font-body text-cocoa-light font-bold text-sm mt-2">Coming soon!</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Edit Modal - Retro Style */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 bg-cocoa/60 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-retro-paper border-3 border-cocoa rounded-xl shadow-pixel-lg w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto retro-scrollbar"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-pixel text-2xl text-cocoa uppercase tracking-widest flex items-center gap-2"><PenLine className="w-5 h-5" strokeWidth={2.5} /> EDIT PROFILE</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="w-10 h-10 rounded-lg bg-pixel-red border-3 border-cocoa text-white flex items-center justify-center shadow-pixel-sm hover:translate-y-[-2px] active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><User className="w-3 h-3" strokeWidth={2.5} /> DISPLAY NAME</label>
                                <input
                                    type="text"
                                    value={editForm.display_name}
                                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                    className="w-full px-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all"
                                />
                            </div>
                            <div>
                                <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><FileText className="w-3 h-3" strokeWidth={2.5} /> BIO</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={4}
                                    className="w-full px-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all resize-none"
                                />
                            </div>
                            <div className="relative">
                                <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><MapPin className="w-3 h-3" strokeWidth={2.5} /> LOCATION</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                                    <input
                                        type="text"
                                        value={editForm.location}
                                        onChange={(e) => {
                                            setEditForm({ ...editForm, location: e.target.value });
                                            setLocationSuggestions(searchLocations(e.target.value));
                                            setShowLocationDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setLocationSuggestions(searchLocations(editForm.location));
                                            setShowLocationDropdown(true);
                                        }}
                                        placeholder="Choose city"
                                        className="w-full pl-12 pr-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all"
                                    />
                                </div>
                                {showLocationDropdown && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-2 w-full max-h-60 overflow-auto bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel retro-scrollbar">
                                        {locationSuggestions.map((loc) => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => {
                                                    setEditForm({ ...editForm, location: loc });
                                                    setShowLocationDropdown(false);
                                                }}
                                                className="w-full px-5 py-3 text-left font-body font-bold text-cocoa hover:bg-pixel-blue transition-colors border-b border-cocoa/20 last:border-b-0 flex items-center gap-2"
                                            >
                                                <MapPin className="w-3 h-3 shrink-0" strokeWidth={2.5} /> {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><Briefcase className="w-3 h-3" strokeWidth={2.5} /> OCCUPATION</label>
                                <input
                                    type="text"
                                    value={editForm.occupation}
                                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                    className="w-full px-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all"
                                />
                            </div>

                            {/* Height & Zodiac - Retro Style */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><Ruler className="w-3 h-3" strokeWidth={2.5} /> HEIGHT</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cocoa-light" />
                                        <input
                                            type="number"
                                            value={editForm.height}
                                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                            placeholder="170"
                                            className="w-full pl-12 pr-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><Star className="w-3 h-3" strokeWidth={2.5} /> ZODIAC</label>
                                    <select
                                        value={editForm.zodiac}
                                        onChange={(e) => setEditForm({ ...editForm, zodiac: e.target.value })}
                                        className="w-full px-5 py-3 bg-retro-white border-3 border-cocoa rounded-lg text-cocoa font-body font-bold shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-all appearance-none"
                                    >
                                        <option value="">Choose...</option>
                                        {ZODIAC_SIGNS.map((z) => (
                                            <option key={z.label} value={z.label}>
                                                {z.emoji} {z.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="font-pixel text-sm text-cocoa uppercase tracking-wider mb-2 block ml-1 flex items-center gap-1"><Tag className="w-3 h-3" strokeWidth={2.5} /> INTERESTS</label>
                                <TagSelector
                                    selectedTags={editForm.tags}
                                    onChange={(tags) => setEditForm({ ...editForm, tags })}
                                    maxTags={5}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 bg-retro-bg text-cocoa font-pixel uppercase tracking-wider rounded-lg border-3 border-cocoa shadow-pixel-sm hover:bg-pixel-red hover:text-white active:translate-y-0.5 active:shadow-none transition-all"
                            >
                                ✕ CANCEL
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-pixel-green text-cocoa font-pixel uppercase tracking-wider rounded-lg border-3 border-cocoa shadow-pixel hover:bg-pixel-pink hover:translate-y-[-2px] hover:shadow-pixel-lg active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin inline" strokeWidth={2.5} />}
                                ✓ SAVE
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Music Search Modal */}
            <MusicSearchModal
                isOpen={isMusicModalOpen}
                onClose={() => setMusicModalOpen(false)}
                onMusicSet={handleSelectMusic}
            />

            {/* AI Profile Analysis Modal */}
            {showAIModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-retro-white border-b-3 border-cocoa p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-pixel-purple border-3 border-cocoa rounded-xl shadow-pixel flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-cocoa" strokeWidth={2.5} />
                                </div>
                                <h2 className="font-pixel text-cocoa uppercase tracking-wider text-lg">
                                    AI Profile Doctor
                                </h2>
                            </div>
                            <button
                                onClick={() => setShowAIModal(false)}
                                className="w-8 h-8 bg-cocoa/10 hover:bg-pixel-red text-cocoa border-2 border-cocoa rounded-lg transition-all flex items-center justify-center"
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {aiAnalyzing ? (
                                <div className="py-12 flex flex-col items-center justify-center">
                                    <Loader2 className="w-12 h-12 text-pixel-purple animate-spin mb-4" strokeWidth={2.5} />
                                    <p className="font-pixel text-cocoa uppercase tracking-wider">Analyzing...</p>
                                    <p className="text-sm text-cocoa-light font-body font-bold mt-2">AI đang phân tích profile của bạn</p>
                                </div>
                            ) : aiResult ? (
                                <>
                                    {/* Score */}
                                    <div className="bg-gradient-to-br from-pixel-pink/20 to-pixel-yellow/20 border-3 border-cocoa rounded-xl p-6 text-center shadow-pixel">
                                        <p className="font-pixel text-cocoa-light uppercase tracking-wider text-sm mb-2">Profile Score</p>
                                        <div className="text-5xl font-pixel text-cocoa mb-2">{aiResult.score}/100</div>
                                        <div className="w-full bg-cocoa/20 h-4 border-2 border-cocoa rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${aiResult.score}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-pixel-pink to-pixel-yellow border-r-2 border-cocoa"
                                            />
                                        </div>
                                    </div>

                                    {/* Roast */}
                                    <div className="bg-pixel-red/10 border-3 border-cocoa rounded-xl p-6 shadow-pixel">
                                        <h3 className="font-pixel text-pixel-red uppercase tracking-wider mb-3 flex items-center gap-2">
                                            🔥 Roast
                                        </h3>
                                        <p className="text-cocoa font-body font-bold leading-relaxed">{aiResult.roast}</p>
                                    </div>

                                    {/* Advice */}
                                    <div className="bg-pixel-green/10 border-3 border-cocoa rounded-xl p-6 shadow-pixel">
                                        <h3 className="font-pixel text-pixel-green uppercase tracking-wider mb-3 flex items-center gap-2">
                                            💡 Advice
                                        </h3>
                                        <p className="text-cocoa font-body font-bold leading-relaxed">{aiResult.advice}</p>
                                    </div>

                                    {/* Improved Bios */}
                                    {aiResult.improved_bios && aiResult.improved_bios.length > 0 && (
                                        <div className="bg-pixel-blue/10 border-3 border-cocoa rounded-xl p-6 shadow-pixel">
                                            <h3 className="font-pixel text-pixel-blue uppercase tracking-wider mb-3 flex items-center gap-2">
                                                ✨ Suggested Bios
                                            </h3>
                                            <div className="space-y-3">
                                                {aiResult.improved_bios.map((bio, i) => (
                                                    <div
                                                        key={i}
                                                        className="bg-retro-white border-2 border-cocoa rounded-lg p-4 font-body font-bold text-cocoa text-sm cursor-pointer hover:bg-pixel-yellow/20 transition-colors"
                                                        onClick={() => {
                                                            setEditForm(prev => ({ ...prev, bio }));
                                                            setShowAIModal(false);
                                                            setShowEditModal(true);
                                                        }}
                                                    >
                                                        {bio}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-cocoa-light font-body font-bold mt-3">
                                                Click vào bio để sử dụng
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAIAnalyze}
                                            disabled={aiAnalyzing}
                                            className="flex-1 py-3 bg-pixel-purple text-cocoa border-3 border-cocoa rounded-lg shadow-pixel hover:bg-purple-400 active:translate-y-0.5 active:shadow-none transition-all font-pixel uppercase tracking-wider disabled:opacity-50"
                                        >
                                            🔄 Phân tích lại
                                        </button>
                                        <button
                                            onClick={() => setShowAIModal(false)}
                                            className="flex-1 py-3 bg-retro-white text-cocoa border-3 border-cocoa rounded-lg shadow-pixel hover:bg-cocoa/10 active:translate-y-0.5 active:shadow-none transition-all font-pixel uppercase tracking-wider"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 flex flex-col items-center justify-center">
                                    <p className="text-cocoa-light font-body font-bold">Không có kết quả</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
