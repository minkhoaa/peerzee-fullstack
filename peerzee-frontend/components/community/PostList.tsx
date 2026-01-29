'use client';

import React from 'react';
import { Package } from 'lucide-react';
import type { Post } from '@/types/community';
import PostCard, { PostCardSkeleton } from './PostCard';

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
              <span className="font-pixel text-sm uppercase text-cocoa-light">
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
          <p className="font-pixel text-sm text-cocoa-light">
            YOU'VE REACHED THE END
          </p>
          <p className="text-xs mt-1 font-body font-bold text-cocoa-light">
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
    <div className="bg-retro-white border-3 border-cocoa shadow-pixel rounded-lg p-8 text-center">
      {/* Pixel Art Empty Box */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="w-full h-full border-3 border-cocoa rounded-lg flex items-center justify-center bg-retro-cream">
          <Package className="w-12 h-12 text-cocoa" />
        </div>
        {/* Pixel dots decoration */}
        <div className="absolute -top-2 -right-2 w-3 h-3 bg-pixel-pink border-2 border-cocoa" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-pixel-pink border-2 border-cocoa" />
      </div>

      <h3 className="font-pixel text-xl mb-2 uppercase text-cocoa">
        No Quests Available Yet
      </h3>
      
      <p className="font-body font-bold text-base leading-relaxed max-w-md mx-auto text-cocoa">
        The quest board is empty! Be the first adventurer to post something and start the journey.
      </p>

      {/* CTA */}
      <button className="mt-6 px-6 py-3 rounded-lg border-2 border-cocoa bg-pixel-pink font-pixel font-bold text-sm uppercase shadow-pixel-sm hover:shadow-[2px_2px_0px_theme(colors.cocoa)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-cocoa">
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
          className="w-2 h-2 bg-cocoa rounded-sm animate-bounce"
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
