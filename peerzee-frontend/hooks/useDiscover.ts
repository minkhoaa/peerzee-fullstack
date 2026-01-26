import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export interface ProfilePhoto {
    id: string;
    url: string;
    isCover?: boolean;
}

export interface ProfilePrompt {
    id: string;
    question: string;
    answer: string;
    emoji?: string;
}

export interface DiscoverUser {
    id: string;
    display_name: string;
    bio?: string;
    location?: string;
    age?: number;
    occupation?: string;
    education?: string;
    photos: ProfilePhoto[];
    prompts: ProfilePrompt[];
    tags: string[];
    spotify?: { song: string; artist: string };
    instagram?: string;
    // Rich Profile additions
    intentMode?: 'DATE' | 'STUDY' | 'FRIEND';
    profileProperties?: {
        zodiac?: string;
        mbti?: string;
        habits?: string[];
        height?: string;
        languages?: string[];
        lookingFor?: string;
    };
    // Distance from PostGIS
    distance_km?: number;
}

interface PaginatedResponse {
    data: DiscoverUser[];
    nextCursor: string | null;
    hasMore: boolean;
}

interface SwipeRequest {
    targetId: string;
    action: 'LIKE' | 'PASS' | 'SUPER_LIKE';
    message?: string;
    likedContentId?: string;
    likedContentType?: 'photo' | 'prompt' | 'vibe';
}

interface SwipeResult {
    isMatch: boolean;
    matchedUser?: {
        id: string;
        display_name: string;
    };
    conversationId?: string;
}

// API functions
const fetchRecommendations = async ({ 
    pageParam,
    lat,
    long,
    radius
}: { 
    pageParam?: string;
    lat?: number;
    long?: number;
    radius?: number;
}): Promise<PaginatedResponse> => {
    const params = new URLSearchParams({ limit: '10' });
    if (pageParam) {
        params.set('cursor', pageParam);
    }
    if (lat !== undefined && long !== undefined) {
        params.set('lat', lat.toString());
        params.set('long', long.toString());
        if (radius) params.set('radius', radius.toString());
    }
    const response = await api.get<PaginatedResponse>(`/discover/recommendations?${params.toString()}`);
    return response.data;
};

const submitSwipe = async (data: SwipeRequest): Promise<SwipeResult> => {
    const response = await api.post<SwipeResult>('/discover/swipe', data);
    return response.data;
};

/**
 * Hook for fetching recommendations with infinite scroll
 * Optional location-based filtering
 */
export function useDiscoverRecommendations(location?: { lat: number; long: number; radius?: number }) {
    return useInfiniteQuery({
        queryKey: ['discover', 'recommendations', location],
        queryFn: ({ pageParam }) => fetchRecommendations({ 
            pageParam,
            lat: location?.lat,
            long: location?.long,
            radius: location?.radius
        }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook for recording swipe actions
 */
export function useSwipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: submitSwipe,
        onSuccess: () => {
            // Invalidate recommendations to potentially fetch new ones
            queryClient.invalidateQueries({ queryKey: ['discover', 'recommendations'] });
        },
    });
}

/**
 * Combined hook for Discover page
 * Optional location-based filtering
 */
export function useDiscover(location?: { lat: number; long: number; radius?: number }) {
    const recommendations = useDiscoverRecommendations(location);
    const swipe = useSwipe();

    // Flatten all pages into a single array
    const users = recommendations.data?.pages.flatMap((page) => page.data) ?? [];

    return {
        users,
        isLoading: recommendations.isLoading,
        isFetchingNextPage: recommendations.isFetchingNextPage,
        hasNextPage: recommendations.hasNextPage,
        fetchNextPage: recommendations.fetchNextPage,
        refetch: recommendations.refetch,
        swipe: swipe.mutateAsync,
        isSwipingLoading: swipe.isPending,
        error: recommendations.error,
    };
}
