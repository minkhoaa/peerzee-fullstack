'use client';

import React from 'react';
import { Package } from 'lucide-react';
import type { Post } from '@/types/community';
import PostCard, { PostCardSkeleton } from './PostCard';

// ============================================
// HIGH CONTRAST COLOR TOKENS (WCAG AA)
// ============================================
const COLORS = {
  text: '#2C1A1D',           // Very Dark Cocoa - Primary text
  textMuted: '#8D6E63',      // Lighter brown - Secondary text
  background: '#FFFFFF',      // Pure White - Card background
  border: '#4A3228',          // Dark Coffee - Borders
} as const;

// ============================================
// POST LIST PROPS
// ============================================
interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  isEmpty?: boolean;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => void;
  onShare?: (postId: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  isFetchingMore?: boolean;
  hasMore?: boolean;
}

// ============================================
// POST LIST COMPONENT
// ============================================
export default function PostList({
  posts,
  isLoading = false,
  isEmpty = false,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onSave,
  onDelete,
  onReport,
  loadMoreRef,
  isFetchingMore = false,
  hasMore = false,
}: PostListProps) {
  // Loading State - Pixel Skeleton Loader
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty State
  if (isEmpty || posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-0">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onSave={onSave}
          onDelete={onDelete}
          onReport={onReport}
        />
      ))}

      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef as React.RefObject<HTMLDivElement | null>} className="py-6 flex justify-center">
          {isFetchingMore && (
            <div className="flex items-center gap-2">
              <LoadingDots />
              <span 
                className="font-pixel text-sm uppercase"
                style={{ color: COLORS.textMuted }}
              >
                Loading more quests...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Fetching More Skeleton */}
      {isFetchingMore && <PostCardSkeleton />}

      {/* End of Feed */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <p 
            className="font-pixel text-sm"
            style={{ color: COLORS.textMuted }}
          >
            YOU'VE REACHED THE END
          </p>
          <p 
            className="text-xs mt-1"
            style={{ color: COLORS.textMuted }}
          >
            No more quests available
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE COMPONENT
// ============================================
function EmptyState() {
  return (
    <div 
      className="bg-white border-[3px] border-[#4A3228] shadow-[4px_4px_0px_#4A3228] rounded-lg p-8 text-center"
    >
      {/* Pixel Art Empty Box */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div 
          className="w-full h-full border-[4px] border-[#4A3228] rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#FFF9F5' }}
        >
          <Package className="w-12 h-12" style={{ color: COLORS.border }} />
        </div>
        {/* Pixel dots decoration */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-[#FF9EB5] border-2 border-[#4A3228]" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-[#FF9EB5] border-2 border-[#4A3228]" />
      </div>

      <h3 
        className="font-pixel text-xl mb-2 uppercase"
        style={{ color: COLORS.text }}
      >
        No Quests Available Yet
      </h3>
      
      <p 
        className="font-body text-base leading-relaxed max-w-md mx-auto"
        style={{ color: COLORS.text }}
      >
        The quest board is empty! Be the first adventurer to post something and start the journey.
      </p>

      {/* CTA */}
      <button
        className="mt-6 px-6 py-3 rounded-lg border-[3px] border-[#4A3228] bg-[#FF9EB5] font-pixel font-bold text-sm uppercase shadow-[3px_3px_0px_#4A3228] hover:shadow-[2px_2px_0px_#4A3228] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        style={{ color: COLORS.border }}
      >
        CREATE FIRST QUEST
      </button>
    </div>
  );
}

// ============================================
// LOADING DOTS ANIMATION
// ============================================
function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-[#4A3228] rounded-sm animate-bounce"
          style={{ 
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// EXPORT SUB-COMPONENTS
// ============================================
export { EmptyState, LoadingDots };
