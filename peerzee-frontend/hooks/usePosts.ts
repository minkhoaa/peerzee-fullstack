import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    type InfiniteData,
} from '@tanstack/react-query';
import { communityApi, type FeedResponse } from '@/lib/communityApi';

// Query Keys
export const postKeys = {
    all: ['posts'] as const,
    feed: () => [...postKeys.all, 'feed'] as const,
    detail: (id: string) => [...postKeys.all, 'detail', id] as const,
};

/**
 * Hook for fetching infinite posts feed
 */
export function usePosts() {
    return useInfiniteQuery({
        queryKey: postKeys.feed(),
        queryFn: async ({ pageParam }) => {
            return communityApi.fetchPosts(pageParam, 10);
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        select: (data) => ({
            pages: data.pages,
            pageParams: data.pageParams,
            // Support both 'data' (new API) and 'posts' (legacy API)
            posts: data.pages.flatMap((page) => page.data || page.posts || []),
        }),
    });
}

/**
 * Hook for creating a new post
 */
export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: communityApi.createPost,
        onSuccess: (data) => {
            // Optimistically add the new post to the cache
            queryClient.setQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed(),
                (old) => {
                    if (!old) return old;

                    const newPages = [...old.pages];
                    if (newPages[0] && data.post) {
                        const currentData = newPages[0].data || newPages[0].posts || [];
                        newPages[0] = {
                            ...newPages[0],
                            data: [data.post, ...currentData],
                        };
                    }

                    return {
                        ...old,
                        pages: newPages,
                    };
                }
            );
        },
    });
}

/**
 * Hook for Reddit-style voting with optimistic updates
 */
export function useVote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, value }: { postId: string; value: 1 | -1 | 0 }) => {
            return communityApi.vote(postId, value);
        },
        onMutate: async ({ postId, value }) => {
            await queryClient.cancelQueries({ queryKey: postKeys.feed() });

            const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed()
            );

            queryClient.setQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed(),
                (old) => {
                    if (!old) return old;

                    const newPages = old.pages.map((page) => {
                        const currentPosts = page.data || page.posts || [];
                        return {
                            ...page,
                            data: currentPosts.map((post) => {
                                if (post.id === postId) {
                                    const oldVote = post.userVote || 0;
                                    const scoreDiff = value - oldVote;
                                    return {
                                        ...post,
                                        userVote: value,
                                        score: (post.score || 0) + scoreDiff,
                                    };
                                }
                                return post;
                            }),
                        };
                    });

                    return { ...old, pages: newPages };
                }
            );

            return { previousData };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(postKeys.feed(), context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        },
    });
}

/**
 * Hook for toggling like with optimistic updates (Legacy - use useVote instead)
 */
export function useToggleLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: communityApi.toggleLike,
        onMutate: async (postId: string) => {
            await queryClient.cancelQueries({ queryKey: postKeys.feed() });

            const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed()
            );

            queryClient.setQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed(),
                (old) => {
                    if (!old) return old;

                    const newPages = old.pages.map((page) => {
                        const currentPosts = page.data || page.posts || [];
                        return {
                            ...page,
                            data: currentPosts.map((post) => {
                                if (post.id === postId) {
                                    const newUserVote = post.userVote === 1 ? 0 : 1;
                                    const scoreDiff = newUserVote - (post.userVote || 0);
                                    return {
                                        ...post,
                                        userVote: newUserVote,
                                        score: (post.score || 0) + scoreDiff,
                                        isLiked: newUserVote === 1,
                                        likesCount: ((post.likesCount || post.score || 0) + scoreDiff),
                                    };
                                }
                                return post;
                            }),
                        };
                    });

                    return { ...old, pages: newPages };
                }
            );

            return { previousData };
        },
        onError: (_err, _postId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(postKeys.feed(), context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        },
    });
}

/**
 * Hook for deleting a post
 */
export function useDeletePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: communityApi.deletePost,
        onMutate: async (postId: string) => {
            await queryClient.cancelQueries({ queryKey: postKeys.feed() });

            const previousData = queryClient.getQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed()
            );

            // Optimistically remove the post
            queryClient.setQueryData<InfiniteData<FeedResponse>>(
                postKeys.feed(),
                (old) => {
                    if (!old) return old;

                    const newPages = old.pages.map((page) => {
                        const currentData = page.data || page.posts || [];
                        return {
                            ...page,
                            data: currentData.filter((post) => post.id !== postId),
                        };
                    });

                    return {
                        ...old,
                        pages: newPages,
                    };
                }
            );

            return { previousData };
        },
        onError: (_err, _postId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(postKeys.feed(), context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: postKeys.feed() });
        },
    });
}
