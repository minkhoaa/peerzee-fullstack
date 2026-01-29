'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, Loader2, MapPin, Music, Play, Pause, Edit, Heart, Star, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { profileApi } from '@/lib/api';
import { searchLocations } from '@/lib/vietnam-locations';
import { TagSelector } from '@/components/TagSelector';
import { MusicSearchModal } from '@/components/profile/MusicSearchModal';
import ProfilePhotos from '@/components/profile/ProfilePhotos';
import { ZODIAC_SIGNS } from '@/lib/profile-tags';
import { WoodenFrame, PixelButton, CarvedInput, CarvedTextarea } from '@/components/village';
import { GlobalHeader } from '@/components/layout';

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
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMusicModalOpen, setMusicModalOpen] = useState(false);
    const [isEditingPhotos, setIsEditingPhotos] = useState(false);

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
            const photos = profile?.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
            const res = await profileApi.uploadPhoto(file, photos.length === 0);
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to upload:', err);
        } finally {
            setUploading(false);
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
            setProfile(prev => prev ? { ...prev, spotify: music } : null);
            setMusicModalOpen(false);
        } catch (err) {
            console.error('Failed to set music:', err);
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
            <div className="min-h-screen grass-dots flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen grass-dots flex flex-col items-center justify-center gap-4">
                <div className="text-6xl">😢</div>
                <p className="font-pixel text-wood-dark">COULD NOT LOAD PROFILE</p>
                <PixelButton onClick={() => router.push('/discover')}>
                    ← GO BACK
                </PixelButton>
            </div>
        );
    }

    const photos = profile.photos?.sort((a, b) => (a.order || 0) - (b.order || 0)) || [];
    const avatarUrl = photos[0]?.url;

    const musicData = profile.spotify && 'cover' in profile.spotify
        ? profile.spotify as MusicData
        : profile.spotify
            ? { ...profile.spotify, cover: '', previewUrl: undefined }
            : null;

    return (
        <div className="min-h-screen grass-dots flex flex-col">
            <GlobalHeader
                title="CHARACTER SHEET"
                subtitle="Hero Registry • My Profile"
                showBack
                onBack={() => router.back()}
                action={
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-3 py-1.5 font-pixel text-xs uppercase border-2 transition-all hover:opacity-80"
                        style={{
                            backgroundColor: '#6B5344',
                            borderColor: '#261E1A',
                            color: '#E0C097',
                        }}
                    >
                        ✏️ EDIT
                    </button>
                }
            />

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
            />

            <div className="flex-1 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                        {/* Hero Card */}
                        <div>
                            <WoodenFrame>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="font-pixel text-2xl text-wood-dark">HERO CARD</h2>
                                        <PixelButton
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setShowEditModal(true)}
                                        >
                                            <Edit className="w-4 h-4" />
                                            EDIT
                                        </PixelButton>
                                    </div>

                                    <div className="relative mb-6">
                                        <div className="aspect-square border-4 border-wood-dark overflow-hidden bg-gradient-to-br from-accent-blue to-accent-blue/70">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="font-pixel text-6xl text-parchment">?</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-3 right-3 w-12 h-12 bg-primary-orange border-3 border-wood-dark flex items-center justify-center hover:bg-primary-red transition-colors"
                                        >
                                            <Camera className="w-6 h-6 text-parchment" />
                                        </button>

                                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-landscape-green border-3 border-wood-dark px-6 py-2">
                                            <p className="font-pixel text-xl text-parchment text-center">LEVEL {profile.age || '?'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mt-8">
                                        <div className="text-center">
                                            <h3 className="font-pixel text-3xl text-wood-dark mb-1">{profile.display_name || 'Unknown'}</h3>
                                            <p className="text-wood-dark/70">Age {profile.age || '?'}</p>
                                        </div>

                                        <div className="bg-cork/30 border-2 border-wood-dark p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Briefcase className="w-4 h-4 text-wood-dark" />
                                                <span className="font-pixel text-sm text-wood-dark">CLASS</span>
                                            </div>
                                            <p className="text-sm text-wood-dark">{profile.occupation || 'Not set'}</p>
                                        </div>

                                        <div className="bg-cork/30 border-2 border-wood-dark p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="w-4 h-4 text-wood-dark" />
                                                <span className="font-pixel text-sm text-wood-dark">REGION</span>
                                            </div>
                                            <p className="text-sm text-wood-dark">{profile.location || 'Not set'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-3 gap-2">
                                        <div className="bg-parchment border-2 border-wood-dark p-3 text-center">
                                            <Heart className="w-5 h-5 text-accent-pink mx-auto mb-1" />
                                            <div className="font-pixel text-xl text-accent-pink">{stats.likes}</div>
                                            <div className="text-xs text-wood-dark/60">LIKES</div>
                                        </div>
                                        <div className="bg-parchment border-2 border-wood-dark p-3 text-center">
                                            <Star className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
                                            <div className="font-pixel text-xl text-accent-yellow">{stats.matches}</div>
                                            <div className="text-xs text-wood-dark/60">MATCHES</div>
                                        </div>
                                        <div className="bg-parchment border-2 border-wood-dark p-3 text-center">
                                            <span className="text-xl mx-auto mb-1 block">👁️</span>
                                            <div className="font-pixel text-xl text-landscape-green">{stats.views}</div>
                                            <div className="text-xs text-wood-dark/60">VIEWS</div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-cork/30 border-2 border-wood-dark p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-pixel text-sm text-wood-dark">PROFILE POWER</span>
                                            <span className="font-pixel text-sm text-primary-orange">{strength}%</span>
                                        </div>
                                        <div className="h-4 bg-parchment border-2 border-wood-dark">
                                            <div
                                                className="h-full bg-landscape-green transition-all"
                                                style={{ width: `${strength}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </WoodenFrame>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-6">
                            {/* Music Widget */}
                            <WoodenFrame>
                                <div className="p-6">
                                    <h3 className="font-pixel text-xl text-wood-dark mb-4">THEME SONG</h3>
                                    <div
                                        onClick={() => setMusicModalOpen(true)}
                                        className="bg-parchment border-3 border-wood-dark p-4 flex items-center gap-4 cursor-pointer hover:border-primary-orange transition-colors"
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
                                                        className="w-16 h-16 bg-wood-dark border-4 border-primary-orange overflow-hidden flex items-center justify-center"
                                                    >
                                                        {musicData.cover ? (
                                                            <img src={musicData.cover} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Music className="w-6 h-6 text-primary-orange" />
                                                        )}
                                                    </motion.div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsPlaying(!isPlaying);
                                                        }}
                                                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-orange border-2 border-wood-dark flex items-center justify-center text-parchment"
                                                    >
                                                        {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                    </button>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-pixel text-wood-dark truncate">
                                                        {musicData.song}
                                                    </p>
                                                    <p className="text-wood-dark/70 text-sm truncate">
                                                        {musicData.artist}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 bg-cork/50 border-2 border-dashed border-wood-dark flex items-center justify-center">
                                                    <Music className="w-6 h-6 text-wood-dark/50" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-pixel text-wood-dark/70">No music set</p>
                                                    <p className="text-wood-dark/50 text-sm">Add your anthem</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </WoodenFrame>

                            {/* Interests */}
                            <WoodenFrame>
                                <div className="p-6">
                                    <h3 className="font-pixel text-xl text-wood-dark mb-4">INTERESTS</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.tags && profile.tags.length > 0 ? (
                                            profile.tags.map((tag, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-primary-orange text-parchment px-3 py-2 font-pixel text-sm border-2 border-wood-dark"
                                                >
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-wood-dark/70 text-sm">No interests added yet</span>
                                        )}
                                    </div>
                                </div>
                            </WoodenFrame>

                            {/* Photos/Inventory */}
                            <WoodenFrame>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="font-pixel text-xl text-wood-dark">PHOTO INVENTORY</h3>
                                            <p className="text-xs text-wood-dark/60">Upload up to 6 photos</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-pixel text-sm text-primary-orange">
                                                {photos.length}/6 SLOTS
                                            </span>
                                            <PixelButton
                                                variant={isEditingPhotos ? 'primary' : 'secondary'}
                                                size="sm"
                                                onClick={() => setIsEditingPhotos(!isEditingPhotos)}
                                            >
                                                {isEditingPhotos ? '✓ DONE' : '✏️ EDIT'}
                                            </PixelButton>
                                        </div>
                                    </div>

                                    <ProfilePhotos
                                        photos={photos}
                                        isOwnProfile={true}
                                        isEditing={isEditingPhotos}
                                        onUpload={handlePhotoUploadFile}
                                        onDelete={handleDeletePhoto}
                                    />
                                </div>
                            </WoodenFrame>

                            {/* Bio */}
                            {profile.bio && (
                                <WoodenFrame variant="cork">
                                    <div className="p-6">
                                        <h3 className="font-pixel text-xl text-wood-dark mb-4">ABOUT ME</h3>
                                        <p className="text-wood-dark leading-relaxed">{profile.bio}</p>
                                    </div>
                                </WoodenFrame>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-parchment border-4 border-wood-dark w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-pixel text-2xl text-wood-dark">EDIT PROFILE</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="w-10 h-10 bg-cork border-2 border-wood-dark hover:bg-primary-red hover:text-parchment flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <CarvedInput
                                label="Display Name"
                                pixelLabel
                                value={editForm.display_name}
                                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                            />

                            <CarvedTextarea
                                label="Bio"
                                pixelLabel
                                value={editForm.bio}
                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                rows={4}
                            />

                            <div className="relative">
                                <CarvedInput
                                    label="Location"
                                    pixelLabel
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
                                />
                                {showLocationDropdown && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-parchment border-3 border-wood-dark">
                                        {locationSuggestions.slice(0, 10).map((loc) => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => {
                                                    setEditForm({ ...editForm, location: loc });
                                                    setShowLocationDropdown(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm text-wood-dark hover:bg-cork/50 transition-colors"
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <CarvedInput
                                label="Occupation"
                                pixelLabel
                                value={editForm.occupation}
                                onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <CarvedInput
                                    label="Height (cm)"
                                    pixelLabel
                                    type="number"
                                    value={editForm.height}
                                    onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                    placeholder="170"
                                />
                                <div>
                                    <label className="font-pixel text-sm text-wood-dark mb-2 block">ZODIAC</label>
                                    <select
                                        value={editForm.zodiac}
                                        onChange={(e) => setEditForm({ ...editForm, zodiac: e.target.value })}
                                        className="w-full px-4 py-3 bg-parchment border-3 border-wood-dark text-wood-dark focus:border-primary-orange outline-none transition-colors"
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

                            <div>
                                <label className="font-pixel text-sm text-wood-dark mb-2 block">INTERESTS</label>
                                <TagSelector
                                    selectedTags={editForm.tags}
                                    onChange={(tags) => setEditForm({ ...editForm, tags })}
                                    maxTags={5}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <PixelButton
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowEditModal(false)}
                            >
                                CANCEL
                            </PixelButton>
                            <PixelButton
                                variant="success"
                                className="flex-1"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                SAVE CHANGES
                            </PixelButton>
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
        </div>
    );
}
