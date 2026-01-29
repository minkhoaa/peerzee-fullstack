'use client';

import React, { useState } from 'react';
import { Heart, MessageSquare, MoreHorizontal, Trash2, User } from 'lucide-react';
import type { Post } from '@/types/community';
import { PushPin } from '@/components/village';

// ============================================
// VILLAGE THEME COLORS
// ============================================
const COLORS = {
  parchment: '#FDF5E6',       // Note background
  parchmentDark: '#F5E6D3',   // Slightly darker parchment
  wood: '#8B5A2B',            // Wood brown
  woodDark: '#4A3B32',        // Dark wood border
  text: '#3E2723',            // Dark brown text
  textMuted: '#795548',       // Medium brown
  orange: '#E65100',          // Accent orange
  red: '#C62828',             // Like red
  green: '#2E7D32',           // Online green
} as const;

// Pin colors for variety
const PIN_COLORS: Array<'pink' | 'red' | 'blue' | 'yellow' | 'green'> = ['red', 'blue', 'yellow', 'green', 'pink'];

interface NoteCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  pinColor?: 'pink' | 'red' | 'blue' | 'yellow' | 'green';
}

/**
 * NoteCard - A pinned note on the bulletin board
 * Village/Cork board aesthetic
 */
export function NoteCard({ 
  post, 
  currentUserId, 
  onLike, 
  onDelete,
  pinColor = 'red' 
}: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUserId === post.author.id;

  // Random slight rotation for natural look
  const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];
  const rotation = rotations[parseInt(post.id, 36) % rotations.length];

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className={`relative ${rotation} hover:rotate-0 transition-transform duration-300`}>
      {/* Push Pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <PushPin color={pinColor} size="md" />
      </div>

      {/* Note Card */}
      <div
        className="p-5 pt-6 border-4 relative"
        style={{
          backgroundColor: COLORS.parchment,
          borderColor: COLORS.woodDark,
          boxShadow: `4px 4px 8px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Author Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 border-2 overflow-hidden flex-shrink-0"
              style={{ borderColor: COLORS.woodDark }}
            >
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: COLORS.parchmentDark, color: COLORS.text }}
                >
                  <User className="w-5 h-5" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div>
              <p
                className="font-pixel text-sm"
                style={{ color: COLORS.text }}
              >
                {post.author.username}
              </p>
              <p
                className="text-xs"
                style={{ color: COLORS.textMuted }}
              >
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Options Menu */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-black/5 rounded transition-colors"
                style={{ color: COLORS.textMuted }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div
                  className="absolute right-0 top-full mt-1 py-1 border-2 z-20 min-w-[120px]"
                  style={{
                    backgroundColor: COLORS.parchment,
                    borderColor: COLORS.woodDark,
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  <button
                    onClick={() => {
                      onDelete?.(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p
          className="text-sm leading-relaxed mb-3 font-body"
          style={{ color: COLORS.text }}
        >
          {post.content}
        </p>

        {/* Image */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-3 -mx-2">
            <div
              className="border-2 overflow-hidden"
              style={{ borderColor: COLORS.woodDark }}
            >
              <img
                src={post.imageUrls[0]}
                alt="Post image"
                className="w-full h-48 object-cover"
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-xs font-medium border"
                style={{
                  backgroundColor: '#FFF8E1',
                  borderColor: COLORS.wood,
                  color: COLORS.wood,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions Footer */}
        <div
          className="flex items-center gap-4 pt-3 border-t border-dashed"
          style={{ borderColor: COLORS.wood }}
        >
          <button
            onClick={() => onLike?.(post.id)}
            className="flex items-center gap-1 transition-colors hover:scale-105"
            style={{ color: post.isLiked ? COLORS.red : COLORS.textMuted }}
          >
            <Heart
              className="w-4 h-4"
              fill={post.isLiked ? COLORS.red : 'none'}
            />
            <span className="text-sm font-medium">{post.stats.likes}</span>
          </button>
          <button
            className="flex items-center gap-1 transition-colors hover:scale-105"
            style={{ color: COLORS.textMuted }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">{post.stats.comments}</span>
          </button>
          {post.stats.likes > 50 && (
            <span
              className="ml-auto text-xs font-pixel"
              style={{ color: COLORS.orange }}
            >
              Read More
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteCard;
