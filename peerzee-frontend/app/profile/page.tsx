'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Check, X, Pencil, Plus, Trash2, Loader2, MapPin, Ruler } from 'lucide-react';
import { profileApi } from '@/lib/api';
import { searchLocations } from '@/lib/vietnam-locations';
import { TagSelector } from '@/components/TagSelector';
import { ZODIAC_SIGNS, EDUCATION_LEVELS, getTagDisplay } from '@/lib/profile-tags';

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

    return (
        <div className="min-h-screen bg-[#0D0D0D]">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
            />

            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-lg">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-[#9B9A97] hover:text-white rounded-lg hover:bg-[#1A1A1A] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
                {/* Profile Strength Card */}
                <div className="bg-[#1A1A1A] rounded-xl p-5 flex items-center gap-6">
                    <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90">
                            <circle cx="40" cy="40" r="35" fill="none" stroke="#2A2A2A" strokeWidth="6" />
                            <circle
                                cx="40" cy="40" r="35" fill="none"
                                stroke="#3B82F6" strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${strength * 2.2} 220`}
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white font-semibold">
                            {strength}%
                        </span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-3">Profile Strength</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2.5">
                                <span className={photos.length > 0 ? 'text-blue-400' : 'text-[#505050]'}>
                                    {photos.length > 0 ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                                </span>
                                <span className="text-[#9B9A97]">Profile photo</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className={profile.bio ? 'text-blue-400' : 'text-[#505050]'}>
                                    {profile.bio ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                                </span>
                                <span className="text-[#9B9A97]">Bio & interests</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="text-red-400"><X className="w-4 h-4" /></span>
                                <span className="text-[#9B9A97]">ID verification</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden sm:block bg-[#1E3A5F] rounded-lg p-4 max-w-[200px]">
                        <p className="text-blue-400 text-xs font-medium mb-1">🤖 AI TIP</p>
                        <p className="text-[#9B9A97] text-xs leading-relaxed">Complete ID verification to unlock premium matches</p>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-[#1A1A1A] rounded-xl overflow-hidden">
                    <div className="h-36 bg-gradient-to-r from-blue-600 to-blue-400 relative">
                        {coverPhoto && <img src={coverPhoto} alt="" className="w-full h-full object-cover opacity-40" />}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-3 right-3 p-2 bg-[#1A1A1A]/80 rounded-lg text-white hover:bg-[#1A1A1A] transition-colors"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="px-5 pb-5">
                        <div className="-mt-12 mb-4 relative inline-block">
                            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#1A1A1A] overflow-hidden">
                                {photos.length > 0 ? (
                                    <img src={photos[0].url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    profile.display_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                        </div>

                        <div className="flex items-start justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-bold text-white">{profile.display_name || 'Unknown'}</h2>
                                <p className="text-[#9B9A97] text-sm">@{profile.display_name?.toLowerCase().replace(/\s/g, '') || 'user'}</p>
                            </div>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#252525] hover:bg-[#303030] text-white text-sm rounded-lg transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                Edit Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#252525] rounded-lg py-4 text-center">
                                <p className="text-2xl font-bold text-white">{stats.matches}</p>
                                <p className="text-xs text-[#9B9A97] mt-1">Matches</p>
                            </div>
                            <div className="bg-[#252525] rounded-lg py-4 text-center">
                                <p className="text-2xl font-bold text-white">{stats.likes}</p>
                                <p className="text-xs text-[#9B9A97] mt-1">Likes</p>
                            </div>
                            <div className="bg-[#252525] rounded-lg py-4 text-center">
                                <p className="text-2xl font-bold text-white">{stats.views}</p>
                                <p className="text-xs text-[#9B9A97] mt-1">Views</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-[#9B9A97] text-sm">Verified profile</span>
                        </div>
                    </div>
                </div>

                {/* About Card */}
                <div className="bg-[#1A1A1A] rounded-xl p-5">
                    <h3 className="text-white font-semibold mb-3">About</h3>
                    <p className="text-[#9B9A97] text-sm leading-relaxed">
                        {profile.bio || 'No bio yet. Add a bio to let others know more about you!'}
                    </p>
                    {(profile.location || profile.occupation) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {profile.location && <span className="px-3 py-1.5 bg-[#252525] text-[#9B9A97] text-sm rounded-lg">📍 {profile.location}</span>}
                            {profile.occupation && <span className="px-3 py-1.5 bg-[#252525] text-[#9B9A97] text-sm rounded-lg">💼 {profile.occupation}</span>}
                        </div>
                    )}
                    {profile.tags && profile.tags.length > 0 && (
                        <div className="mt-4">
                            <p className="text-[#9B9A97] text-xs mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                                {profile.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-[#252525] text-white text-sm rounded-lg">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Photos Card */}
                <div className="bg-[#1A1A1A] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold">Photos</h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#252525] hover:bg-[#303030] text-white text-sm rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {photos.map((photo) => (
                            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-[#252525] relative group">
                                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#1A1A1A] rounded-xl w-full max-w-md p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Edit Profile</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-[#9B9A97] hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[#9B9A97] mb-1 block">Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.display_name}
                                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-[#9B9A97] mb-1 block">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                            <div className="relative">
                                <label className="text-xs text-[#9B9A97] mb-1 block">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9A97]" />
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
                                        placeholder="Chọn tỉnh/thành phố"
                                        className="w-full pl-9 pr-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                {showLocationDropdown && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto bg-[#252525] border border-[#2F2F2F] rounded-lg shadow-lg">
                                        {locationSuggestions.slice(0, 10).map((loc) => (
                                            <button
                                                key={loc}
                                                type="button"
                                                onClick={() => {
                                                    setEditForm({ ...editForm, location: loc });
                                                    setShowLocationDropdown(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#303030] transition-colors"
                                            >
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs text-[#9B9A97] mb-1 block">Occupation</label>
                                <input
                                    type="text"
                                    value={editForm.occupation}
                                    onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                                    className="w-full px-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Height & Zodiac */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-[#9B9A97] mb-1 block">Chiều cao (cm)</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9A97]" />
                                        <input
                                            type="number"
                                            value={editForm.height}
                                            onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                                            placeholder="170"
                                            className="w-full pl-9 pr-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-[#9B9A97] mb-1 block">Cung hoàng đạo</label>
                                    <select
                                        value={editForm.zodiac}
                                        onChange={(e) => setEditForm({ ...editForm, zodiac: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#252525] border border-[#2F2F2F] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                                    >
                                        <option value="">Chọn...</option>
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
                                <label className="text-xs text-[#9B9A97] mb-2 block">Sở thích & Tính cách</label>
                                <TagSelector
                                    selectedTags={editForm.tags}
                                    onChange={(tags) => setEditForm({ ...editForm, tags })}
                                    maxTags={5}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-2.5 bg-[#252525] text-[#9B9A97] rounded-lg hover:bg-[#303030] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
