/**
 * Community Types - API-Ready TypeScript Interfaces
 * WCAG AA Compliant Design System
 */

// ============================================
// CORE USER MODEL
// ============================================
export interface User {
  id: string;
  username: string; // e.g., "PixelPal_99"
  avatarUrl: string;
  level: number; // For the RPG badge
  isOnline?: boolean;
}

// ============================================
// POST MODEL
// ============================================
export interface PostStats {
  likes: number;
  comments: number;
  shares: number;
}

export interface Post {
  id: string;
  content: string;
  imageUrls?: string[]; // Optional images
  author: User;
  createdAt: string; // ISO Date
  stats: PostStats;
  tags: string[]; // e.g., ["#Retro", "#Help"]
  isLiked?: boolean; // Current user state
  isSaved?: boolean; // Bookmarked state
}

// ============================================
// COMMENT MODEL
// ============================================
export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
}

// ============================================
// TRENDING/SIDEBAR DATA
// ============================================
export interface TrendingTopic {
  id: string;
  tag: string;
  postCount: number;
}

export interface SuggestedUser {
  id: string;
  user: User;
  mutualFriends: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface PostsResponse {
  posts: Post[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total: number;
}

export interface CreatePostPayload {
  content: string;
  imageUrls?: string[];
  tags?: string[];
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
}

// ============================================
// UI STATE TYPES
// ============================================
export type FeedLoadingState = 'idle' | 'loading' | 'error' | 'success';

export interface FeedState {
  posts: Post[];
  loading: FeedLoadingState;
  error: string | null;
  hasMore: boolean;
  cursor?: string;
}
