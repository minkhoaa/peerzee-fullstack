"use client";

import React from "react";
import { motion } from "framer-motion";
import { Camera, Loader2 } from "lucide-react";

interface ProfileHeroProps {
  coverPhoto?: string;
  avatarUrl?: string;
  displayName: string;
  username: string;
  bio?: string;
  stats: {
    matches: number;
    likes: number;
    views: number;
  };
  uploading?: boolean;
  onEditClick: () => void;
  onCoverUploadClick: () => void;
}

export function ProfileHero({
  coverPhoto,
  avatarUrl,
  displayName,
  username,
  bio,
  stats,
  uploading = false,
  onEditClick,
  onCoverUploadClick,
}: ProfileHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDF0F1] p-2 rounded-[50px] shadow-xl shadow-[#CD6E67]/10 w-full relative overflow-visible"
    >
      {/* Cover Image */}
      <div className="h-64 w-full rounded-[40px] overflow-hidden bg-[#E5C0C5] relative">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[#CD6E67]/30 text-6xl">🎨</div>
          </div>
        )}
        
        {/* Upload Button */}
        <button
          onClick={onCoverUploadClick}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-[#CD6E67] hover:bg-white hover:scale-110 active:scale-95 transition-all"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="pt-20 pb-8 px-10 relative">
        {/* Avatar (Overlapping) */}
        <div className="absolute -top-16 left-10">
          <div className="w-40 h-40 rounded-full border-[6px] border-[#FDF0F1] shadow-lg bg-white overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#CD6E67] to-[#E5C0C5] flex items-center justify-center text-white text-5xl font-black font-nunito">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Edit Button (Top-right) */}
        <div className="absolute top-8 right-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEditClick}
            className="bg-[#CD6E67] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#CD6E67]/20 hover:bg-[#B55B55] transition-colors flex items-center gap-2"
          >
            ✏️ Edit Profile
          </motion.button>
        </div>

        {/* Name & Username */}
        <div className="mb-4">
          <h1 className="text-4xl font-black text-[#3E3229] font-nunito mb-1">
            {displayName}
          </h1>
          <p className="text-[#CD6E67] font-bold text-lg flex items-center gap-2">
            <span>@{username}</span>
            <span className="w-5 h-5 bg-[#CD6E67] rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </p>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-[#7A6862] font-semibold text-lg max-w-2xl leading-relaxed mb-6">
            {bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex gap-8 mt-6">
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.matches}
            </span>
            <span className="text-sm font-bold text-[#CD6E67] uppercase tracking-wide">
              Matches
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.likes}
            </span>
            <span className="text-sm font-bold text-[#CD6E67] uppercase tracking-wide">
              Likes
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.views}
            </span>
            <span className="text-sm font-bold text-[#CD6E67] uppercase tracking-wide">
              Views
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
