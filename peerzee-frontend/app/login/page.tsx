"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { AxiosError } from "axios";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, Mail, KeyRound } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import type { LoginDto } from "@/types";

const SocialIcons = {
  google: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  ),
  github: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  ),
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: LoginDto = {
        email: formData.email,
        password: formData.password,
        device: "web",
      };
      const { data } = await authApi.login(payload);
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("userId", data.user_id);
      router.push("/chat");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {/* Header */}
      <div className="mb-8">
        <h2 className="font-pixel text-3xl text-cocoa uppercase tracking-widest mb-2">
          SIGN IN
        </h2>
        <p className="font-body text-cocoa-light font-bold">
          Welcome back, Player 1!
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-pixel-red/20 border-3 border-pixel-red text-cocoa rounded-lg shadow-pixel-sm flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
          <span className="font-body font-bold text-sm">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div className="flex flex-col gap-2">
          <label className="font-pixel text-cocoa uppercase tracking-wider text-sm ml-1 flex items-center gap-1.5">
            <Mail className="w-4 h-4" strokeWidth={2.5} /> EMAIL
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-14 px-5 rounded-lg bg-retro-white border-3 border-cocoa text-cocoa font-body font-bold placeholder-cocoa-light shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-colors"
            placeholder="player1@game.com"
            required
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ml-1 mr-1">
            <label className="font-pixel text-cocoa uppercase tracking-wider text-sm flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" strokeWidth={2.5} /> PASSWORD
            </label>
            <a href="#" className="font-pixel text-xs text-pixel-pink-dark hover:text-pixel-pink uppercase tracking-wider">
              Forgot?
            </a>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full h-14 px-5 rounded-lg bg-retro-white border-3 border-cocoa text-cocoa font-body font-bold placeholder-cocoa-light shadow-pixel-inset focus:outline-none focus:border-pixel-pink transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full h-14 bg-pixel-pink text-cocoa font-pixel text-xl uppercase tracking-widest rounded-lg border-3 border-cocoa shadow-pixel hover:bg-pixel-pink-dark hover:translate-y-[-2px] hover:shadow-pixel-lg active:translate-y-1 active:shadow-none transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
              LOADING...
            </>
          ) : (
            <>
              <span>Sign In</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Social Login */}
      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-3 border-dashed border-cocoa/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-retro-paper font-pixel text-cocoa-light uppercase tracking-wider">
              Or Continue With
            </span>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-6">
          <button
            type="button"
            className="w-14 h-14 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-sm flex items-center justify-center text-cocoa hover:bg-pixel-blue hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all"
          >
            {SocialIcons.google}
          </button>
          <button
            type="button"
            className="w-14 h-14 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-sm flex items-center justify-center text-cocoa hover:bg-pixel-blue hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all"
          >
            {SocialIcons.github}
          </button>
        </div>
      </div>

      {/* Toggle to Register */}
      <div className="text-center mt-6 font-body text-cocoa-light font-bold">
        New player?
        <Link href="/register" className="font-pixel text-pixel-pink-dark hover:text-pixel-pink uppercase tracking-wider ml-2">
          CREATE ACCOUNT →
        </Link>
      </div>
    </AuthCard>
  );
}
