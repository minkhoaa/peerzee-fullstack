"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { AxiosError } from "axios";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";
import type { RegisterDto } from "@/types";

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
};

export default function RegisterPage() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        display_name: "",
        phone: "",
        bio: "",
        location: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const payload: RegisterDto = {
                email: formData.email,
                password: formData.password,
                display_name: formData.display_name,
                phone: formData.phone,
                bio: formData.bio,
                location: formData.location,
            };
            await authApi.register(payload);
            router.push("/login");
        } catch (err) {
            const axiosError = err as AxiosError<{ message: string }>;
            setError(axiosError.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-all";

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 py-12 antialiased transition-colors duration-300 relative">
            {/* Theme Toggle */}
            <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                {theme === "light" ? Icons.moon : Icons.sun}
            </button>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm px-4">
                {/* Logo */}
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center">
                        <span className="text-white dark:text-neutral-900 font-bold text-lg">P</span>
                    </div>
                    <span className="font-semibold text-neutral-900 dark:text-white text-xl">Peerzee</span>
                </motion.div>

                {/* Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="p-8 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <h1 className="text-2xl text-center font-semibold text-neutral-900 dark:text-white mb-2">Create account</h1>
                    <p className="text-center text-neutral-500 dark:text-neutral-400 text-sm mb-6">Join Peerzee and start chatting</p>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" required />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Display Name</label>
                            <input type="text" name="display_name" value={formData.display_name} onChange={handleChange} className={inputClass} placeholder="John Doe" required />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+84 xxx xxx xxx" required />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••" minLength={6} required />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirm</label>
                                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClass} placeholder="••••••" required />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} className={inputClass + " resize-none"} placeholder="Tell us about yourself..." rows={2} required />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <label className="block mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Location</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClass} placeholder="Ho Chi Minh City" required />
                        </motion.div>

                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </>
                            ) : "Create account"}
                        </motion.button>
                    </form>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    Already have an account?{" "}
                    <Link href="/login" className="text-neutral-900 dark:text-white font-medium hover:underline">
                        Sign in
                    </Link>
                </motion.p>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                    className="mt-4 text-center text-xs text-neutral-400">
                    <Link href="/" className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">← Back to home</Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
