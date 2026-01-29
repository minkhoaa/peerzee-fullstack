'use client';

import React, { useState } from 'react';
import { Heart, MessageSquare, MoreHorizontal, Trash2, User } from 'lucide-react';
import type { Post } from '@/types/community';
import { PushPin } from '@/components/village';

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
 * Fresh Sage & Cool Taupe palette
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
      <div className="p-5 pt-6 border-3 border-cocoa relative bg-retro-paper shadow-pixel">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 border-2 border-cocoa overflow-hidden flex-shrink-0 bg-retro-white">
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt={post.author.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-cocoa/10 text-cocoa">
                  <User className="w-5 h-5" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <div>
              <p className="font-pixel text-sm text-cocoa font-bold">
                {post.author.username}
              </p>
              <p className="text-xs font-body font-bold text-cocoa-light">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Options Menu */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-cocoa/10 rounded transition-colors text-cocoa-light"
              >
                <MoreHorizontal className="w-5 h-5" strokeWidth={2.5} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 py-1 border-3 border-cocoa z-20 min-w-[120px] bg-retro-paper shadow-pixel">
                  <button
                    onClick={() => {
                      onDelete?.(post.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-pixel-red/20 text-pixel-red text-sm font-body font-bold"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed mb-3 font-body font-bold text-cocoa">
          {post.content}
        </p>

        {/* Image */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mb-3 -mx-2">
            <div className="rounded-lg border-3 border-cocoa overflow-hidden shadow-pixel-sm">
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
                className="px-2 py-1 text-xs font-pixel border-2 border-cocoa bg-cocoa text-retro-white font-bold rounded-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center gap-4 pt-3 border-t border-dashed border-cocoa">
          <button
            onClick={() => onLike?.(post.id)}
            className={`flex items-center gap-1 transition-colors hover:scale-105 ${
              post.isLiked ? 'text-pixel-red' : 'text-cocoa-light'
            }`}
          >
            <Heart
              className="w-4 h-4"
              fill={post.isLiked ? 'currentColor' : 'none'}
              strokeWidth={2.5}
            />
            <span className="text-sm font-body font-bold">{post.stats.likes}</span>
          </button>
          <button className="flex items-center gap-1 transition-colors hover:scale-105 text-cocoa-light">
            <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-body font-bold">{post.stats.comments}</span>
          </button>
          {post.stats.likes > 50 && (
            <span className="ml-auto text-xs font-pixel text-pixel-pink font-bold">
              Read More
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteCard;
