import api from './api';

// Types matching backend response
export interface PostAuthor {
    id: string;
    email: string;
    display_name?: string;
    avatar?: string;
}

export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    filename?: string;
    originalName?: string;
    size?: number;
}

export interface SocialPost {
    id: string;
    content: string;
    media: MediaItem[];
    tags: string[];
    // Reddit-style voting
    score: number;
    userVote: number; // 1 (Up), -1 (Down), 0 (None)
    // Legacy support
    likesCount?: number;
    isLiked?: boolean;
    // Other fields
    commentsCount: number;
    createdAt: string;
    updatedAt: string;
    author: PostAuthor;
}

export interface FeedResponse {
    ok: boolean;
    data: SocialPost[]; // API returns 'data' not 'posts'
    posts?: SocialPost[]; // Legacy support
    nextCursor: string | null;
    hasMore: boolean;
}

export interface ToggleLikeResponse {
    ok: boolean;
    liked: boolean;
    likesCount: number;
}

export interface CreatePostDto {
    content: string;
    tags?: string[];
    media?: MediaItem[];
}

export interface UploadResponse {
    ok: boolean;
    media: MediaItem[];
}

export interface CommentAuthor {
    id: string;
    email: string;
    display_name?: string;
}

export interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: CommentAuthor;
}

export interface CommentsResponse {
    ok: boolean;
    comments: Comment[];
    nextCursor: string | null;
    hasMore: boolean;
}

// API functions
export const communityApi = {
    /**
     * Fetch community feed with cursor-based pagination
     */
    fetchPosts: async (cursor?: string | null, limit: number = 10): Promise<FeedResponse> => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (cursor) {
            params.append('cursor', cursor);
        }

        const response = await api.get<FeedResponse>(`/community/posts?${params.toString()}`);
        return response.data;
    },

    /**
     * Upload media files
     */
    uploadMedia: async (files: File[]): Promise<UploadResponse> => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        const response = await api.post<UploadResponse>('/community/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Create a new post
     */
    createPost: async (dto: CreatePostDto): Promise<{ ok: boolean; post: SocialPost }> => {
        const response = await api.post('/community/posts', dto);
        return response.data;
    },

    /**
     * Toggle like on a post (legacy - use vote instead)
     */
    toggleLike: async (postId: string): Promise<ToggleLikeResponse> => {
        const response = await api.post<ToggleLikeResponse>(`/community/posts/${postId}/like`);
        return response.data;
    },

    /**
     * Vote on a post (Reddit-style: 1=upvote, -1=downvote, 0=unvote)
     */
    vote: async (postId: string, value: 1 | -1 | 0): Promise<{ ok: boolean; newScore: number; userVote: number }> => {
        const response = await api.post(`/community/posts/${postId}/vote`, { value });
        return response.data;
    },

    /**
     * Add a comment to a post
     */
    addComment: async (postId: string, content: string): Promise<{ ok: boolean; comment: Comment }> => {
        const response = await api.post(`/community/posts/${postId}/comments`, { content });
        return response.data;
    },

    /**
     * Get comments for a post
     */
    getComments: async (postId: string, cursor?: string, limit: number = 20): Promise<CommentsResponse> => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (cursor) {
            params.append('cursor', cursor);
        }

        const response = await api.get<CommentsResponse>(`/community/posts/${postId}/comments?${params.toString()}`);
        return response.data;
    },

    /**
     * Delete a post
     */
    deletePost: async (postId: string): Promise<{ ok: boolean }> => {
        const response = await api.delete(`/community/posts/${postId}`);
        return response.data;
    },

    /**
     * Get trending tags
     */
    getTrendingTags: async (limit: number = 5): Promise<{ ok: boolean; tags: TrendingTag[] }> => {
        const response = await api.get(`/community/tags/trending?limit=${limit}`);
        return response.data;
    },
};

// Types for widgets
export interface TrendingTag {
    tag: string;
    count: number;
}

export interface SuggestedUser {
    id: string;
    email: string;
    display_name: string;
    bio?: string;
}

export interface RecentMatch {
    id: string;
    conversationId: string;
    matchedAt: string;
    partner: {
        id: string;
        email: string;
        display_name: string;
    };
}

// Swipe/Match API functions
export const swipeApi = {
    /**
     * Get recent matches for sidebar
     */
    getRecentMatches: async (limit: number = 5): Promise<{ ok: boolean; matches: RecentMatch[] }> => {
        const response = await api.get(`/swipe/matches/recent?limit=${limit}`);
        return response.data;
    },

    /**
     * Get suggested users to connect with
     */
    getSuggestedUsers: async (limit: number = 5): Promise<{ ok: boolean; users: SuggestedUser[] }> => {
        // Changed from /swipe/suggestions to /community/suggested-users
        const response = await api.get(`/community/suggested-users?limit=${limit}`);
        return response.data;
    },
};
