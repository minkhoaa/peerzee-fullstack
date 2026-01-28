'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Plus, Trash2, Loader2, MapPin, Ruler, Music, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileApi } from '@/lib/api';
import { searchLocations } from '@/lib/vietnam-locations';
import { TagSelector } from '@/components/TagSelector';
import { ProfileHero } from '@/components/profile/ProfileHero';
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
    photos?: { id: string; url: string; order?: number }[];
    spotify?: MusicData | { song: string; artist: string } | null;
}

export default function MyProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            const res = await profileApi.getMyProfile();
            const p: UserProfile = res.data;
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
        setUploading(true);
        try {
            const res = await profileApi.uploadPhoto(file, photos.length === 0);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to upload:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoId: string) => {
        try {
            const res = await profileApi.deletePhoto(photoId);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to delete:', err);
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
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center gap-4">
                <p className="text-[#9B9A97]">Không thể tải profile</p>
                <button onClick={() => router.push('/discover')} className="text-sm text-white hover:underline">
                    ← Quay lại
                </button>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    const coverPhoto = photos[0]?.url;
    const avatarUrl = photos[0]?.url;
    const [activeTab, setActiveTab] = useState<'posts' | 'photos'>('photos');
    const [isPlaying, setIsPlaying] = useState(false);

    const musicData = profile.spotify && 'cover' in profile.spotify
        ? profile.spotify as MusicData
        : profile.spotify
            ? { ...profile.spotify, cover: '', previewUrl: undefined }
            : null;

    return (
        <div className="min-h-screen bg-[#ECC8CD] px-4 py-8 flex flex-col items-center gap-8">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
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
                    onCoverUploadClick={() => fileInputRef.current?.click()}
                />

                {/* Toy Widgets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {/* Vinyl Player Widget */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#FDF0F1] p-6 rounded-[40px] shadow-md flex items-center gap-4"
                    >
                        {musicData ? (
                            <>
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: isPlaying ? 360 : 0 }}
                                        transition={{
                                            duration: 3,
                                            repeat: isPlaying ? Infinity : 0,
                                            ease: "linear"
                                        }}
                                        className="w-16 h-16 rounded-full bg-[#3E3229] border-4 border-[#CD6E67] overflow-hidden flex items-center justify-center"
                                    >
                                        {musicData.cover ? (
                                            <img src={musicData.cover} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Music className="w-6 h-6 text-[#CD6E67]" />
                                        )}
                                    </motion.div>
                                    <button
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#CD6E67] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                                    >
                                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#3E3229] truncate text-sm">
                                        {musicData.song}
                                    </p>
                                    <p className="text-[#7A6862] text-xs truncate">
                                        {musicData.artist}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-[#ECC8CD] border-2 border-dashed border-[#CD6E67] flex items-center justify-center">
                                    <Music className="w-6 h-6 text-[#CD6E67]/50" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[#7A6862] text-sm">No music set</p>
                                    <p className="text-[#7A6862] text-xs">Add your anthem</p>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Interest Tags (Candy Jar) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#FDF0F1] p-6 rounded-[40px] shadow-md col-span-1 md:col-span-2 flex flex-wrap gap-3 items-center"
                    >
                        <span className="text-[#CD6E67] font-bold mr-2">Loves:</span>
                        {profile.tags && profile.tags.length > 0 ? (
                            profile.tags.map((tag, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    whileHover={{ y: -4 }}
                                    className="bg-white text-[#3E3229] px-4 py-2 rounded-full font-bold shadow-sm border-b-4 border-[#ECC8CD]/50 cursor-default"
                                >
                                    {tag}
                                </motion.span>
                            ))
                        ) : (
                            <span className="text-[#7A6862] font-semibold text-sm">No interests added yet</span>
                        )}
                    </motion.div>
                </div>

                {/* Content Tabs & Grid */}
                <div className="w-full space-y-6">
                    {/* Tab Switcher */}
                    <div className="flex justify-center">
                        <div className="bg-[#FDF0F1] p-2 rounded-full inline-flex shadow-inner">
                            <button
                                onClick={() => setActiveTab('photos')}
                                className={`px-8 py-3 rounded-full font-bold transition-all ${
                                    activeTab === 'photos'
                                        ? 'bg-[#CD6E67] text-white shadow-md'
                                        : 'text-[#7A6862] hover:bg-[#ECC8CD]/20'
                                }`}
                            >
                                📸 Photos
                            </button>
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-8 py-3 rounded-full font-bold transition-all ${
                                    activeTab === 'posts'
                                        ? 'bg-[#CD6E67] text-white shadow-md'
                                        : 'text-[#7A6862] hover:bg-[#ECC8CD]/20'
                                }`}
                            >
                                📝 Posts
                            </button>
                        </div>
                    </div>

                    {/* Photo Grid */}
                    {activeTab === 'photos' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full"
                        >
                            {photos.length > 0 ? (
                                photos.map((photo) => (
                                    <motion.div
                                        key={photo.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-square bg-[#FDF0F1] rounded-[30px] overflow-hidden shadow-md relative group cursor-pointer"
                                    >
                                        <img
                                            src={photo.url}
                                            alt=""
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-[#CD6E67]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => handleDeletePhoto(photo.id)}
                                                className="p-3 bg-white/90 rounded-full text-[#CD6E67] shadow-lg hover:bg-white transition-all"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-2 md:col-span-3 text-center py-12">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#CD6E67] text-white font-bold rounded-full shadow-lg hover:bg-[#B55B55] hover:scale-105 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Your First Photo
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Posts Tab (Empty State) */}
                    {activeTab === 'posts' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                        >
                            <div className="text-6xl mb-4">📝</div>
                            <p className="text-[#7A6862] font-semibold">No posts yet</p>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#FDF0F1] rounded-[40px] w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-[#3E3229] font-nunito">Edit Profile</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="w-10 h-10 rounded-full bg-[#ECC8CD] hover:bg-[#CD6E67] text-[#3E3229] hover:text-white flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.display_name}
                                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                    className="w-full px-5 py-3 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={4}
                                    className="w-full px-5 py-3 bg-white border-2 border-transparent rounded-[20px] text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all resize-none"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6862]" />
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
                                        className="w-full pl-12 pr-5 py-3 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all"
                                    />
                                </div>
                                {showLocationDropdown && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-2 w-full max-h-48 overflow-auto bg-white border-2 border-[#ECC8CD] rounded-[20px] shadow-xl">
                                        {locationSuggestions.slice(0, 10).map((loc) => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => {
                                                    setEditForm({ ...editForm, location: loc });
                                                    setShowLocationDropdown(false);
                                                }}
                                                className="w-full px-5 py-3 text-left text-sm font-semibold text-[#3E3229] hover:bg-[#FDF0F1] transition-colors"
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Occupation</label>
                                <input
                                    type="text"
                                    value={editForm.occupation}
                                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                    className="w-full px-5 py-3 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all"
                                />
                            </div>

                            {/* Height & Zodiac */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Height (cm)</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A6862]" />
                                        <input
                                            type="number"
                                            value={editForm.height}
                                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                            placeholder="170"
                                            className="w-full pl-12 pr-5 py-3 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Zodiac</label>
                                    <select
                                        value={editForm.zodiac}
                                        onChange={(e) => setEditForm({ ...editForm, zodiac: e.target.value })}
                                        className="w-full px-5 py-3 bg-white border-2 border-transparent rounded-full text-[#3E3229] font-semibold focus:outline-none focus:border-[#CD6E67] focus:ring-4 focus:ring-[#CD6E67]/10 transition-all appearance-none"
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
                                <label className="text-sm font-bold text-[#3E3229] mb-2 block ml-2">Interests</label>
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
                                className="flex-1 py-3 bg-[#ECC8CD] text-[#3E3229] font-bold rounded-full hover:bg-[#E5C0C5] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-[#CD6E67] text-white font-bold rounded-full hover:bg-[#B55B55] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
