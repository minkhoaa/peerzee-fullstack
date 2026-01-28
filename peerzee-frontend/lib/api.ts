import axios from "axios";
import type { LoginDto, LoginResponse, RegisterDto, RegisterResponse, UpdateUserProfileDto } from "@/types";
import type { Conversation as ConversationType } from "@/types/conversation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("userId");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const authApi = {
    login: (data: LoginDto) =>
        api.post<LoginResponse>("/user/login", data),

    register: (data: RegisterDto) =>
        api.post<RegisterResponse>("/user/register", data),

    getProfile: (userId: string) =>
        api.get(`/user/user-profile/${userId}`),

    updateProfile: (userId: string, data: UpdateUserProfileDto) =>
        api.put(`/user/profile/${userId}`, data),
};
export const chatApi = {
    getConversations: () => api.get<ConversationType[]>("/conversation"),
    startDM: (targetUserId: string) =>
        api.post<{ conversationId: string; isDirect: boolean; isNew: boolean }>(
            `/chat/dm/${targetUserId}`
        ),
    suggestReply: (conversationId: string) =>
        api.post<{ suggestions: string[] }>('/chat/suggest-reply', { conversationId }),
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post<{ fileUrl: string; fileName: string; fileType: string }>(
            '/chat/upload',
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
    },
};

// User API for search and user-related operations
export const userApi = {
    searchUsers: (query: string) =>
        api.get(`/user/search?q=${encodeURIComponent(query)}`),

    getUserProfile: (userId: string) =>
        api.get(`/user/profile/${userId}`),

    addTag: (userId: string, tag: string) =>
        api.post('/user/add-tag', { userId, tag }),

    updateProperties: (data: Record<string, unknown>) =>
        api.patch('/user/profile/properties', data),
};

// Rich Profile Types for Matching
export interface ProfilePhoto {
    id: string;
    url: string;
    isCover?: boolean;
    order?: number;
}

export interface ProfilePrompt {
    id: string;
    question: string;
    answer: string;
    emoji?: string;
}

export interface RecommendationUser {
    id: string;
    email: string;
    display_name?: string;
    bio?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    age?: number;
    occupation?: string;
    education?: string;
    photos?: ProfilePhoto[];
    prompts?: ProfilePrompt[];
    tags?: string[];
    spotify?: { song: string; artist: string };
    instagram?: string;
}

export interface SwipeResponse {
    isMatch: boolean;
    matchedUser?: {
        id: string;
        display_name: string;
    };
    conversationId?: string;
}

export interface SwipeRequest {
    targetId: string;
    action: 'LIKE' | 'PASS' | 'SUPER_LIKE';
    message?: string;
    likedContentId?: string;
    likedContentType?: 'photo' | 'prompt' | 'vibe';
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

export const swipeApi = {
    getRecommendations: (limit: number = 10) =>
        api.get<RecommendationUser[]>(`/swipe/recommendations?limit=${limit}&_t=${Date.now()}`),

    swipe: (data: SwipeRequest) =>
        api.post<SwipeResponse>('/swipe', data),

    getMatches: () =>
        api.get('/swipe/matches'),

    getRecentMatches: (limit: number = 5) =>
        api.get<{ ok: boolean; matches: RecentMatch[] }>(`/swipe/matches/recent?limit=${limit}`),

    getLikers: () =>
        api.get('/swipe/matches/likers'),

    unmatch: (matchId: string, block?: boolean) =>
        api.post(`/swipe/matches/${matchId}/unmatch`, { block }),

    report: (targetId: string, reason: string) =>
        api.post('/swipe/report', { targetId, reason }),

    getSuperlikeStatus: () =>
        api.get('/swipe/superlike-status'),

    getSuggestedUsers: (limit: number = 3) =>
        api.get(`/swipe/suggestions?limit=${limit}`),
};

// Profile API for rich profile management
export const profileApi = {
    getMyProfile: () =>
        api.get<RecommendationUser>('/profile/me'),

    updateProfile: (data: Partial<RecommendationUser>) =>
        api.patch<RecommendationUser>('/profile/me', data),

    addPhoto: (url: string, isCover?: boolean) =>
        api.post<RecommendationUser>('/profile/photos', { url, isCover }),

    uploadPhoto: (file: File, isCover?: boolean) => {
        const formData = new FormData();
        formData.append('file', file);
        if (isCover) formData.append('isCover', 'true');
        return api.post<RecommendationUser>('/profile/photos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    deletePhoto: (photoId: string) =>
        api.delete<RecommendationUser>(`/profile/photos/${photoId}`),

    reorderPhotos: (photoIds: string[]) =>
        api.put<RecommendationUser>('/profile/photos/order', { photoIds }),

    getStats: () =>
        api.get<{ matches: number; likes: number; views: number }>('/profile/stats'),

    analyzeProfile: () =>
        api.post<ProfileAnalysisResult>('/profile/analyze'),

    searchMusic: (query: string) =>
        api.get(`/profile/music/search?q=${encodeURIComponent(query)}`),

    setMusic: (musicData: { trackId?: string; song: string; artist: string; cover: string; previewUrl?: string }) =>
        api.put('/profile/music', musicData),

    setSpotify: (accessToken: string, refreshToken: string) =>
        api.post('/profile/spotify', { accessToken, refreshToken }),
};

// AI Profile Doctor Types
export interface ProfileAnalysisResult {
    score: number;
    roast: string;
    advice: string;
    improved_bios: string[];
}

// Hybrid Search Types
export interface SearchFilters {
    gender: 'MALE' | 'FEMALE' | null;
    city: string | null;
    intent: 'FRIEND' | 'DATE' | 'STUDY' | null;
    semantic_text: string;
}

export interface SearchResult extends RecommendationUser {
    matchScore: number;
    matchReason?: string; // "Why we match" explanation
    distance_km?: number; // Distance in kilometers (if location-based search)
}

export interface SearchResponse {
    query: string;
    filters: SearchFilters;
    count: number;
    results: SearchResult[];
}

// Discover API for hybrid semantic search
export const discoverApi = {
    search: (query: string, limit: number = 10, lat?: number, long?: number, radius?: number) => {
        let url = `/discover/search?q=${encodeURIComponent(query)}&limit=${limit}`;
        if (lat !== undefined && long !== undefined) {
            url += `&lat=${lat}&long=${long}`;
            if (radius) url += `&radius=${radius}`;
        }
        return api.get<SearchResponse>(url);
    },

    getRecommendations: (cursor?: string, limit: number = 10, lat?: number, long?: number, radius?: number) => {
        let url = `/discover/recommendations?${cursor ? `cursor=${cursor}&` : ''}limit=${limit}`;
        if (lat !== undefined && long !== undefined) {
            url += `&lat=${lat}&long=${long}`;
            if (radius) url += `&radius=${radius}`;
        }
        return api.get(url);
    },

    swipe: (data: SwipeRequest) =>
        api.post<SwipeResponse>('/discover/swipe', data),
};

// Notification API
export interface Notification {
    id: string;
    userId: string;
    type: 'match' | 'message' | 'like' | 'superlike' | 'profile_view';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}

export interface NotificationsResponse {
    ok: boolean;
    notifications: Notification[];
    nextCursor: string | null;
    hasMore: boolean;
}

export const notificationApi = {
    getNotifications: (cursor?: string, limit: number = 20) => {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        if (cursor) params.append('cursor', cursor);
        return api.get<NotificationsResponse>(`/notifications?${params.toString()}`);
    },

    getUnreadCount: () =>
        api.get<{ count: number }>('/notifications/unread-count'),

    markAsRead: (notificationId: string) =>
        api.patch(`/notifications/${notificationId}/read`),

    markAllAsRead: () =>
        api.patch('/notifications/read-all'),
};

// Conversation API
export interface Conversation {
    id: string;
    participants: Array<{
        id: string;
        display_name?: string;
        email: string;
    }>;
    lastMessage?: {
        content: string;
        createdAt: string;
    };
    unreadCount?: number;
    createdAt: string;
    updatedAt: string;
}

export const conversationApi = {
    getConversations: () =>
        api.get<{ conversations: Conversation[] }>('/conversations'),

    getConversation: (conversationId: string) =>
        api.get<Conversation>(`/conversations/${conversationId}`),

    sendIcebreakerAnswer: (conversationId: string, questionId: string, answer: string) =>
        api.post(`/conversations/${conversationId}/icebreaker`, { questionId, answer }),

    updateConversation: (conversationId: string, data: Partial<Conversation>) =>
        api.patch<Conversation>(`/conversations/${conversationId}`, data),

    deleteConversation: (conversationId: string) =>
        api.delete(`/conversations/${conversationId}`),
};
