'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, MoreHorizontal, Trash2, User, Send, X } from 'lucide-react';
import type { Post, Comment } from '@/types/community';
import { PushPin } from '@/components/village';
import { getAssetUrl } from '@/lib/api';

// Pin colors for variety
const PIN_COLORS: Array<'pink' | 'red' | 'blue' | 'yellow' | 'green'> = ['red', 'blue', 'yellow', 'green', 'pink'];

interface NoteCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onFetchComments?: (postId: string) => Promise<Comment[]>;
  pinColor?: 'pink' | 'red' | 'blue' | 'yellow' | 'green';
}

/**
 * NoteCard - A pinned note on the bulletin board
 * Fresh Sage & Cool Taupe palette with working Like & Comment
 */
export function NoteCard({
  post,
  currentUserId,
  onLike,
  onDelete,
  onComment,
  onFetchComments,
  pinColor = 'red'
}: NoteCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [fetchedComments, setFetchedComments] = useState<Comment[]>([]);
  const [hasFetchedComments, setHasFetchedComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(0);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

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

  // Handle like with animation
  const handleLikeClick = () => {
    setIsLikeAnimating(true);
    onLike?.(post.id);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  // Handle toggle comments - fetch if first time
  const handleToggleComments = async () => {
    const willShow = !showComments;
    setShowComments(willShow);

    // Fetch comments from backend if first time opening
    if (willShow && !hasFetchedComments && onFetchComments) {
      setIsLoadingComments(true);
      try {
        const comments = await onFetchComments(post.id);
        setFetchedComments(comments);
        setHasFetchedComments(true);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

  // All comments to display (local new ones first, then fetched)
  const allComments = [...localComments, ...fetchedComments];

  // Handle comment submit
  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment,
      author: { id: currentUserId || 'guest', username: 'You', avatarUrl: '', level: 1 },
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setLocalComments(prev => [comment, ...prev]);
    setLocalCommentCount(prev => prev + 1);
    setNewComment('');
    onComment?.(post.id, newComment);
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
          <Link
            href={`/profile/${post.author.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-cocoa overflow-hidden shrink-0 bg-retro-white">
              {post.author.avatarUrl ? (
                <img
                  src={getAssetUrl(post.author.avatarUrl)}
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
              <p className="font-pixel text-sm text-cocoa font-bold hover:text-pixel-pink transition-colors">
                {post.author.username}
              </p>
              <p className="text-xs font-body font-bold text-cocoa-light">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </Link>

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
                src={getAssetUrl(post.imageUrls[0])}
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
            onClick={handleLikeClick}
            className={`flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${post.isLiked ? 'text-pixel-red' : 'text-cocoa-light hover:text-pixel-red'
              } ${isLikeAnimating ? 'scale-125' : ''}`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${isLikeAnimating ? 'animate-pulse' : ''}`}
              fill={post.isLiked ? 'currentColor' : 'none'}
              strokeWidth={2.5}
            />
            <span className="text-sm font-body font-bold">{post.stats.likes}</span>
          </button>
          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1 transition-colors hover:scale-105 ${showComments ? 'text-pixel-blue' : 'text-cocoa-light hover:text-pixel-blue'
              }`}
          >
            <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-sm font-body font-bold">{post.stats.comments + localCommentCount}</span>
          </button>
          {post.stats.likes > 50 && (
            <span className="ml-auto text-xs font-pixel text-pixel-pink font-bold">
              Read More
            </span>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-dashed border-cocoa">
            {/* Comment Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-sm bg-retro-white border-2 border-cocoa rounded font-body font-bold text-cocoa placeholder:text-cocoa-light focus:outline-none focus:border-pixel-pink"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                className="px-3 py-2 bg-pixel-pink border-2 border-cocoa text-cocoa rounded shadow-pixel-sm hover:bg-pixel-pink-dark disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Send className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Comments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {isLoadingComments && (
                <p className="text-center text-xs text-cocoa-light font-body py-4">
                  Loading comments...
                </p>
              )}
              {!isLoadingComments && allComments.map((comment) => (
                <div key={comment.id} className="flex gap-2 p-2 bg-retro-white/50 border border-cocoa/30 rounded">
                  <div className="w-6 h-6 border border-cocoa rounded overflow-hidden shrink-0">
                    {comment.author.avatarUrl ? (
                      <img src={getAssetUrl(comment.author.avatarUrl)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-cocoa/10 flex items-center justify-center">
                        <User className="w-3 h-3 text-cocoa" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-pixel text-cocoa font-bold">{comment.author.username}</span>
                      <span className="text-xs text-cocoa-light font-body">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs font-body text-cocoa mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
              {!isLoadingComments && allComments.length === 0 && (
                <p className="text-center text-xs text-cocoa-light font-body py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteCard;
