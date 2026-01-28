import { useQuery } from '@tanstack/react-query';
import { communityApi, type TrendingTag } from '@/lib/communityApi';
import { swipeApi } from '@/lib/api';

// Re-export types for convenience
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

/**
 * Hook to fetch trending tags for right sidebar
 */
export function useTrendingTags(limit: number = 5) {
    return useQuery<TrendingTag[]>({
        queryKey: ['trending-tags', limit],
        queryFn: async () => {
            const response = await communityApi.getTrendingTags(limit);
            return response.tags;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch suggested users for right sidebar
 */
export function useSuggestedUsers(limit: number = 5) {
    return useQuery<SuggestedUser[]>({
        queryKey: ['suggested-users', limit],
        queryFn: async () => {
            const response = await communityApi.getSuggestedUsers(limit);
            return response.users;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch recent matches for left sidebar
 */
export function useRecentMatches(limit: number = 5) {
    return useQuery<RecentMatch[]>({
        queryKey: ['recent-matches', limit],
        queryFn: async () => {
            const response = await swipeApi.getRecentMatches(limit);
            return response.data.matches;
        },
        staleTime: 2 * 60 * 1000, // 2 minutes (more dynamic)
        gcTime: 5 * 60 * 1000,
    });
}
