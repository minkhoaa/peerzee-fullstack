"use client";

import React from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, PenLine } from "lucide-react";

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
  onAvatarUploadClick?: () => void;
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
  onAvatarUploadClick,
}: ProfileHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex flex-col w-full bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel overflow-visible"
    >
      {/* Cover Section - Retro Style */}
      <div className="h-48 w-full rounded-t-lg bg-pixel-blue border-b-3 border-cocoa relative overflow-hidden">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pixel-blue to-pixel-pink">
            <div className="text-cocoa/30 text-6xl font-pixel">P</div>
          </div>
        )}
        
        {/* Upload Button - Retro Style */}
        <button
          onClick={onCoverUploadClick}
          className="absolute bottom-4 right-4 w-12 h-12 bg-retro-white border-3 border-cocoa rounded-lg shadow-pixel-sm flex items-center justify-center text-cocoa hover:bg-pixel-pink hover:translate-y-[-2px] active:translate-y-0.5 active:shadow-none transition-all"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* The Anchor Bar - Avatar & Edit Button */}
      <div className="flex justify-between items-end px-8 -mt-12 mb-4">
        {/* Avatar (Left) - Pixel Style - Clickable for upload */}
        <div 
          onClick={onAvatarUploadClick}
          className="w-32 h-32 rounded-xl border-3 border-cocoa bg-retro-white shadow-pixel z-10 overflow-hidden shrink-0 relative group cursor-pointer hover:shadow-pixel-lg transition-all"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pixel-pink to-pixel-blue flex items-center justify-center text-cocoa font-pixel text-4xl uppercase">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Hover overlay for upload */}
          {onAvatarUploadClick && (
            <div className="absolute inset-0 bg-cocoa/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-retro-white animate-spin" strokeWidth={2.5} />
              ) : (
                <Camera className="w-8 h-8 text-retro-white" strokeWidth={2.5} />
              )}
            </div>
          )}
        </div>

        {/* Edit Button (Right) - Retro Style */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEditClick}
          className="mb-2 bg-pixel-pink text-cocoa px-6 py-2 rounded-lg border-3 border-cocoa font-pixel uppercase tracking-widest shadow-pixel-sm hover:bg-pixel-pink-dark hover:translate-y-[-2px] active:translate-y-0.5 active:shadow-none transition-all text-sm flex items-center gap-2"
        >
          <PenLine className="w-4 h-4" strokeWidth={2.5} /> EDIT
        </motion.button>
      </div>

      {/* Info Section */}
      <div className="px-8 pb-8 flex flex-col gap-2">
        {/* Name & Username */}
        <div>
          <h1 className="font-pixel text-3xl text-cocoa uppercase tracking-widest mb-1">
            {displayName}
          </h1>
          <p className="font-body text-pixel-pink-dark font-bold text-sm flex items-center gap-2">
            <span>@{username}</span>
            <span className="w-5 h-5 bg-pixel-green border-2 border-cocoa rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-cocoa" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </p>
        </div>

        {/* Bio */}
        {bio && (
          <p className="font-body text-cocoa-light font-bold text-base leading-relaxed mt-2">
            {bio}
          </p>
        )}

        {/* Stats Row - Retro Style */}
        <div className="flex gap-6 border-t-3 border-dashed border-cocoa/30 pt-4 mt-4">
          <div className="flex flex-col items-center bg-pixel-pink px-4 py-2 border-3 border-cocoa rounded-lg shadow-pixel-sm">
            <span className="font-pixel text-2xl text-cocoa">
              {stats.matches}
            </span>
            <span className="font-pixel text-xs text-cocoa uppercase tracking-wider">
              MATCHES
            </span>
          </div>
          <div className="flex flex-col items-center bg-pixel-blue px-4 py-2 border-3 border-cocoa rounded-lg shadow-pixel-sm">
            <span className="font-pixel text-2xl text-cocoa">
              {stats.likes}
            </span>
            <span className="font-pixel text-xs text-cocoa uppercase tracking-wider">
              LIKES
            </span>
          </div>
          <div className="flex flex-col items-center bg-pixel-yellow px-4 py-2 border-3 border-cocoa rounded-lg shadow-pixel-sm">
            <span className="font-pixel text-2xl text-cocoa">
              {stats.views}
            </span>
            <span className="font-pixel text-xs text-cocoa uppercase tracking-wider">
              VIEWS
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
