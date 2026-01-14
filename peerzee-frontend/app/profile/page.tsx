"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";
import api from "@/lib/api";

interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    bio: string;
    location: string;
    phone: string;
    createdAt: string;
}

const Icons = {
    sun: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    moon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
    back: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    ),
    edit: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    ),
    location: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    mail: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    phone: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    calendar: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
};

export default function ProfilePage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        display_name: "",
        bio: "",
        location: "",
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        loadProfile();
    }, [router]);

    const loadProfile = async () => {
        try {
            const res = await api.get<UserProfile>("/user/profile");
            setProfile(res.data);
            setFormData({
                display_name: res.data.display_name || "",
                bio: res.data.bio || "",
                location: res.data.location || "",
            });
        } catch (err) {
            console.error(err);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await api.put("/user/profile", formData);
            setProfile(prev => prev ? { ...prev, ...formData } : null);
            setEditing(false);
            setSuccess("Profile updated successfully!");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error(err);
            setError("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center">
                        <span className="text-white dark:text-neutral-900 font-bold text-sm">P</span>
                    </div>
                    <span className="text-neutral-500 dark:text-neutral-400 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 antialiased transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/chat" className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                            {Icons.back}
                        </Link>
                        <h1 className="font-semibold">Profile</h1>
                    </div>
                    <button onClick={toggleTheme} className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        {theme === "light" ? Icons.moon : Icons.sun}
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-8">
                {/* Success/Error Messages */}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400 rounded-xl text-sm">
                        {success}
                    </motion.div>
                )}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </motion.div>
                )}

                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl">
                    {/* Cover & Avatar */}
                    <div className="h-40 bg-gradient-to-br from-neutral-300 via-neutral-400 to-neutral-500 dark:from-neutral-700 dark:via-neutral-800 dark:to-neutral-900 relative">
                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                        }} />
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-900 to-black dark:from-white dark:via-neutral-200 dark:to-neutral-300 flex items-center justify-center text-white dark:text-neutral-900 font-bold text-4xl border-4 border-white dark:border-neutral-900 shadow-2xl transition-transform hover:scale-105">
                                    {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                {/* Camera icon overlay for future upload */}
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        {!editing && (
                            <button onClick={() => setEditing(true)}
                                className="absolute top-4 right-4 px-5 py-2.5 text-sm font-medium bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-neutral-800 hover:scale-105 transition-all shadow-lg flex items-center gap-2">
                                {Icons.edit}
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="pt-20 pb-8 px-8 text-center">
                        {editing ? (
                            <div className="space-y-5 text-left">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                        className={inputClass}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Bio</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className={inputClass + " resize-none"}
                                        rows={3}
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Location</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className={inputClass}
                                        placeholder="Your location"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setEditing(false)} className="flex-1 py-3 text-sm font-medium border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:scale-[1.02] transition-all">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex-1 py-3 text-sm font-medium bg-gradient-to-r from-neutral-800 via-neutral-900 to-black dark:from-white dark:via-neutral-100 dark:to-neutral-200 text-white dark:text-neutral-900 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {saving ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </>
                                        ) : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-2">{profile?.display_name || "Unknown"}</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">{profile?.bio || "No bio yet"}</p>

                                <div className="space-y-4 max-w-sm mx-auto">
                                    <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                        <span className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">{Icons.mail}</span>
                                        <span>{profile?.email}</span>
                                    </div>
                                    {profile?.phone && (
                                        <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                            <span className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">{Icons.phone}</span>
                                            <span>{profile.phone}</span>
                                        </div>
                                    )}
                                    {profile?.location && (
                                        <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                            <span className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">{Icons.location}</span>
                                            <span>{profile.location}</span>
                                        </div>
                                    )}
                                    {profile?.createdAt && (
                                        <div className="flex items-center gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                                            <span className="p-2 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">{Icons.calendar}</span>
                                            <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="mt-6 text-center">
                    <Link href="/chat" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                        ← Back to Chat
                    </Link>
                </div>
            </main>
        </div>
    );
}
