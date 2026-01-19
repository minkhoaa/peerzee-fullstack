import axios from "axios";
import type { LoginDto, LoginResponse, RegisterDto, RegisterResponse, UpdateUserProfileDto } from "@/types";
import { Conversation } from "@/types/conversation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
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
    getConversations: () => api.get<Conversation[]>("/conversation"),
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

export const swipeApi = {
    getRecommendations: (limit: number = 10) =>
        api.get<RecommendationUser[]>(`/swipe/recommendations?limit=${limit}&_t=${Date.now()}`),

    swipe: (data: SwipeRequest) =>
        api.post<SwipeResponse>('/swipe', data),

    getMatches: () =>
        api.get('/swipe/matches'),

    getRecentMatches: (limit: number = 5) =>
        api.get<{ ok: boolean; matches: unknown[] }>(`/swipe/matches/recent?limit=${limit}`),
};

// Profile API for rich profile management
export const profileApi = {
    getMyProfile: () =>
        api.get<RecommendationUser>('/profile/me'),

    updateProfile: (data: Partial<RecommendationUser>) =>
        api.patch<RecommendationUser>('/profile/me', data),

    addPhoto: (url: string, isCover?: boolean) =>
        api.post<RecommendationUser>('/profile/photos', { url, isCover }),

    reorderPhotos: (photoIds: string[]) =>
        api.put<RecommendationUser>('/profile/photos/order', { photoIds }),
};
