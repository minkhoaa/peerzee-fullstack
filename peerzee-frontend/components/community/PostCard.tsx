'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Trash2, 
  Send, 
  Loader2,
  Flag
} from 'lucide-react';
import type { Post, Comment, User } from '@/types/community';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa - Primary text
  textMuted: '#8D6E63',      // Lighter brown - Secondary text (still readable)
  background: '#FFFFFF',      // Pure White - Card background
  border: '#4A3228',          // Dark Coffee - Borders
  interactive: '#D946EF',     // Magenta - Links/buttons
  interactiveAlt: '#EC4899',  // Pink - Alternative interactive
  placeholder: '#A1887F',     // Readable Brown - Placeholders
  buttonBg: '#FF9EB5',        // Soft Pink - Button background
  danger: '#DC2626',          // Red - Danger/delete
  success: '#16A34A',         // Green - Success states
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============================================
// POST CARD COMPONENT
// ============================================
interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
}

export default function PostCard({ 
  post, 
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onDelete,
  onReport
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.stats.likes);
  const [localIsLiked, setLocalIsLiked] = useState(post.isLiked ?? false);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.stats.comments);
  const [localIsSaved, setLocalIsSaved] = useState(post.isSaved ?? false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = currentUserId === post.author.id;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Focus input when comments open
  useEffect(() => {
    if (showComments && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showComments]);

  const handleLike = useCallback(() => {
    setLocalIsLiked(prev => !prev);
    setLocalLikes(prev => localIsLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  }, [localIsLiked, onLike, post.id]);

  const handleSave = useCallback(() => {
    setLocalIsSaved(prev => !prev);
    onSave?.(post.id);
  }, [onSave, post.id]);

  const handleToggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Mock comment creation - replace with actual API call
      const mockComment: Comment = {
        id: `comment-${Date.now()}`,
        content: newComment.trim(),
        author: {
          id: currentUserId || 'guest',
          username: 'You',
          avatarUrl: '',
          level: 1
        },
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      setComments(prev => [...prev, mockComment]);
      setNewComment('');
      setLocalCommentsCount(prev => prev + 1);
      onComment?.(post.id, newComment.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(() => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    onDelete?.(post.id);
    setShowMenu(false);
  }, [onDelete, post.id]);

  const handleReport = useCallback(() => {
    onReport?.(post.id);
    setShowMenu(false);
  }, [onReport, post.id]);

  return (
    <article 
      className="bg-white border-[3px] border-[#4A3228] shadow-[4px_4px_0px_#4A3228] p-0 rounded-lg mb-6 overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b-[2px] border-[#4A3228]/20">
        {/* Avatar with Level Badge */}
        <div className="relative">
          {post.author.avatarUrl ? (
            <img 
              src={post.author.avatarUrl} 
              alt={post.author.username}
              className="w-11 h-11 rounded-lg border-[2px] border-[#4A3228] object-cover"
            />
          ) : (
            <div 
              className="w-11 h-11 rounded-lg border-[2px] border-[#4A3228] flex items-center justify-center font-pixel text-sm"
              style={{ backgroundColor: COLORS.buttonBg, color: COLORS.border }}
            >
              {getInitials(post.author.username)}
            </div>
          )}
          {/* Level Badge */}
          <div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded border-[2px] border-[#4A3228] flex items-center justify-center font-pixel text-[10px]"
            style={{ backgroundColor: COLORS.buttonBg, color: COLORS.border }}
          >
            {post.author.level}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <button 
            className="font-pixel text-xl hover:underline cursor-pointer block truncate"
            style={{ color: COLORS.text }}
          >
            {post.author.username}
          </button>
          <span 
            className="text-sm font-bold"
            style={{ color: COLORS.textMuted }}
          >
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-pink-50 transition-colors"
            style={{ color: COLORS.textMuted }}
            aria-label="More options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div 
              className="absolute right-0 top-10 z-20 bg-white border-[3px] border-[#4A3228] shadow-[3px_3px_0px_#4A3228] rounded-lg py-1 min-w-[140px]"
            >
              {isAuthor ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 font-pixel text-xs uppercase hover:bg-red-50 w-full transition-colors"
                  style={{ color: COLORS.danger }}
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE
                </button>
              ) : (
                <button
                  onClick={handleReport}
                  className="flex items-center gap-2 px-4 py-2 font-pixel text-xs uppercase hover:bg-red-50 w-full transition-colors"
                  style={{ color: COLORS.danger }}
                >
                  <Flag className="w-4 h-4" />
                  REPORT
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4">
        <p 
          className="font-body text-base leading-relaxed whitespace-pre-wrap break-words my-3"
          style={{ color: COLORS.text }}
        >
          {post.content}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <button
                key={index}
                className="px-2 py-1 rounded border-[2px] border-[#4A3228] font-pixel text-xs uppercase hover:bg-pink-50 transition-colors"
                style={{ 
                  backgroundColor: COLORS.background, 
                  color: COLORS.interactive 
                }}
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </button>
            ))}
          </div>
        )}

        {/* Images */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className={`grid gap-2 mb-4 ${post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {post.imageUrls.slice(0, 4).map((url, index) => (
              <div 
                key={index} 
                className="relative rounded-lg border-[3px] border-[#4A3228] overflow-hidden aspect-video"
              >
                <img 
                  src={url} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                />
                {index === 3 && post.imageUrls && post.imageUrls.length > 4 && (
                  <div 
                    className="absolute inset-0 bg-[#4A3228]/80 flex items-center justify-center"
                  >
                    <span className="font-pixel text-white text-xl">
                      +{post.imageUrls.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar (Footer) */}
      <div className="flex items-center gap-2 px-4 py-3 border-t-[2px] border-[#4A3228]/20">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-[2px] border-[#4A3228] font-pixel text-xs uppercase transition-all hover:bg-pink-50 ${
            localIsLiked ? 'bg-pink-100' : 'bg-white'
          }`}
          style={{ color: localIsLiked ? COLORS.danger : COLORS.text }}
        >
          <Heart className={`w-4 h-4 ${localIsLiked ? 'fill-current' : ''}`} />
          <span>{formatNumber(localLikes)}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleToggleComments}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-[2px] border-[#4A3228] font-pixel text-xs uppercase transition-all hover:bg-pink-50 ${
            showComments ? 'bg-pink-100' : 'bg-white'
          }`}
          style={{ color: COLORS.text }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{formatNumber(localCommentsCount)}</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => onShare?.(post.id)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border-[2px] border-[#4A3228] font-pixel text-xs uppercase transition-all hover:bg-pink-50 bg-white"
          style={{ color: COLORS.text }}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">SHARE</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-[2px] border-[#4A3228] font-pixel text-xs uppercase transition-all hover:bg-pink-50 ml-auto ${
            localIsSaved ? 'bg-yellow-100' : 'bg-white'
          }`}
          style={{ color: localIsSaved ? '#B45309' : COLORS.text }}
        >
          <Bookmark className={`w-4 h-4 ${localIsSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t-[2px] border-[#4A3228]/20 p-4 bg-[#FFF9F5]">
          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 rounded-lg border-[2px] border-dashed border-[#4A3228] bg-white text-base outline-none focus:border-solid focus:border-[#D946EF] transition-all"
              style={{ 
                color: COLORS.text,
                '::placeholder': { color: COLORS.placeholder }
              } as React.CSSProperties}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className={`p-2 rounded-lg border-[2px] border-[#4A3228] transition-all ${
                newComment.trim() && !isSubmitting
                  ? 'bg-[#FF9EB5] hover:bg-[#FF8DA6] cursor-pointer'
                  : 'bg-gray-100 cursor-not-allowed opacity-50'
              }`}
              style={{ color: COLORS.border }}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: COLORS.interactive }} />
              </div>
            ) : comments.length === 0 ? (
              <p 
                className="text-sm text-center py-4 font-body"
                style={{ color: COLORS.textMuted }}
              >
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ============================================
// COMMENT ITEM SUB-COMPONENT
// ============================================
interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked ?? false);
  const [likes, setLikes] = useState(comment.likes);

  const handleLike = () => {
    setIsLiked(prev => !prev);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      {comment.author.avatarUrl ? (
        <img 
          src={comment.author.avatarUrl} 
          alt={comment.author.username}
          className="w-8 h-8 rounded-lg border-[2px] border-[#4A3228] object-cover flex-shrink-0"
        />
      ) : (
        <div 
          className="w-8 h-8 rounded-lg border-[2px] border-[#4A3228] flex items-center justify-center font-pixel text-xs flex-shrink-0"
          style={{ backgroundColor: '#E8F5E9', color: COLORS.border }}
        >
          {getInitials(comment.author.username)}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div 
          className="bg-white rounded-lg border-[2px] border-[#4A3228] p-3 shadow-[2px_2px_0px_#4A3228]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="font-pixel text-sm"
              style={{ color: COLORS.text }}
            >
              {comment.author.username}
            </span>
            <span 
              className="text-xs font-bold"
              style={{ color: COLORS.textMuted }}
            >
              · {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p 
            className="font-body text-sm leading-relaxed"
            style={{ color: COLORS.text }}
          >
            {comment.content}
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-3 mt-1 ml-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs font-bold transition-colors ${
              isLiked ? 'text-red-500' : ''
            }`}
            style={{ color: isLiked ? COLORS.danger : COLORS.textMuted }}
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button 
            className="text-xs font-bold hover:underline"
            style={{ color: COLORS.textMuted }}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SKELETON LOADER (Pixel Style)
// ============================================
export function PostCardSkeleton() {
  return (
    <div className="bg-white border-[3px] border-[#4A3228] shadow-[4px_4px_0px_#4A3228] rounded-lg mb-6 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 p-4 border-b-[2px] border-[#4A3228]/20">
        <div className="w-11 h-11 rounded-lg bg-[#E8D5C4] border-[2px] border-[#4A3228]" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-[#E8D5C4] rounded mb-2" />
          <div className="h-3 w-20 bg-[#E8D5C4] rounded" />
        </div>
      </div>

      {/* Body Skeleton */}
      <div className="p-4">
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-[#E8D5C4] rounded w-full" />
          <div className="h-4 bg-[#E8D5C4] rounded w-4/5" />
          <div className="h-4 bg-[#E8D5C4] rounded w-3/5" />
        </div>
        
        {/* Tags Skeleton */}
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-[#E8D5C4] rounded border-[2px] border-[#4A3228]" />
          <div className="h-6 w-20 bg-[#E8D5C4] rounded border-[2px] border-[#4A3228]" />
        </div>

        {/* Image Skeleton */}
        <div className="h-48 bg-[#E8D5C4] rounded-lg border-[3px] border-[#4A3228]" />
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-t-[2px] border-[#4A3228]/20">
        <div className="h-9 w-20 bg-[#E8D5C4] rounded-lg border-[2px] border-[#4A3228]" />
        <div className="h-9 w-20 bg-[#E8D5C4] rounded-lg border-[2px] border-[#4A3228]" />
        <div className="h-9 w-20 bg-[#E8D5C4] rounded-lg border-[2px] border-[#4A3228]" />
      </div>
    </div>
  );
}
