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
      className="relative flex flex-col w-full bg-[#FDF0F1] rounded-[40px] shadow-xl shadow-[#CD6E67]/10 overflow-visible"
    >
      {/* Cover Section */}
      <div className="h-48 w-full rounded-t-[40px] bg-[#E5C0C5] relative overflow-hidden">
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

      {/* The Anchor Bar - Avatar & Edit Button */}
      <div className="flex justify-between items-end px-8 -mt-12 mb-4">
        {/* Avatar (Left) */}
        <div className="w-32 h-32 rounded-full border-[6px] border-[#FDF0F1] bg-white shadow-md z-10 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#CD6E67] to-[#E5C0C5] flex items-center justify-center text-white text-4xl font-black font-nunito">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Edit Button (Right) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEditClick}
          className="mb-2 bg-[#CD6E67] text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-[#CD6E67]/20 hover:bg-[#B55B55] transition-colors text-sm flex items-center gap-2"
        >
          ✏️ Edit Profile
        </motion.button>
      </div>

      {/* Info Section */}
      <div className="px-8 pb-8 flex flex-col gap-2">
        {/* Name & Username */}
        <div>
          <h1 className="text-3xl font-black text-[#3E3229] font-nunito mb-1">
            {displayName}
          </h1>
          <p className="text-[#CD6E67] font-bold text-sm flex items-center gap-2">
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
          <p className="text-[#7A6862] font-semibold text-base leading-relaxed mt-2">
            {bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex gap-8 border-t border-[#ECC8CD]/30 pt-4 mt-4">
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.matches}
            </span>
            <span className="text-xs font-bold text-[#CD6E67] uppercase tracking-wide">
              Matches
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.likes}
            </span>
            <span className="text-xs font-bold text-[#CD6E67] uppercase tracking-wide">
              Likes
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-2xl text-[#3E3229]">
              {stats.views}
            </span>
            <span className="text-xs font-bold text-[#CD6E67] uppercase tracking-wide">
              Views
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
