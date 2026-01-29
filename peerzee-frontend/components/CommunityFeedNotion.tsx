'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X, Loader2, Film, Send, Star } from 'lucide-react';
import { usePosts, useCreatePost } from '@/hooks/usePosts';
import { communityApi, type MediaItem } from '@/lib/communityApi';
import PostCardNotion, { PostCardNotionSkeleton } from './PostCardNotion';
import { WoodenFrame, PushPin, PixelButton, CarvedTextarea } from './village';

interface FilePreview extends File {
    preview: string;
}

/**
 * CreatePostNotion - Village themed post creation form
 * "Pin a Note" - Medieval bulletin board style
 */
function CreatePostNotion() {
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const createPostMutation = useCreatePost();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file =>
            Object.assign(file, { preview: URL.createObjectURL(file) })
        );
        setFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }, []);

    const { getRootProps, getInputProps, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov'],
        },
        maxSize: 50 * 1024 * 1024,
        noClick: true,
        noKeyboard: true,
    });

    const removeFile = (index: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            URL.revokeObjectURL(newFiles[index].preview);
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    const handlePost = async () => {
        if ((!content.trim() && files.length === 0) || isUploading || createPostMutation.isPending) return;

        try {
            let mediaItems: MediaItem[] = [];
            if (files.length > 0) {
                setIsUploading(true);
                const uploadResult = await communityApi.uploadMedia(files);
                mediaItems = uploadResult.media;
            }

            await createPostMutation.mutateAsync({ content: content.trim(), media: mediaItems });
            setContent('');
            files.forEach(file => URL.revokeObjectURL(file.preview));
            setFiles([]);
            setIsFocused(false);
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const isSubmitting = isUploading || createPostMutation.isPending;
    const canSubmit = (content.trim() || files.length > 0) && !isSubmitting;

    return (
        <div {...getRootProps()} className="relative mb-6">
            <WoodenFrame variant="cork">
                <div className="relative p-6">
                    <div className="absolute -top-3 left-8 z-10">
                        <PushPin color="red" />
                    </div>
                    
                    <h2 className="font-pixel text-xl text-wood-dark mb-4">PIN A NOTE</h2>
                    
                    <input {...getInputProps()} />

                    <CarvedTextarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        placeholder="What's happening in the village?"
                        rows={3}
                        disabled={isSubmitting}
                    />

                    {/* File Previews */}
                    {files.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="relative group aspect-square border-3 border-wood-dark overflow-hidden"
                                >
                                    {file.type.startsWith('video/') ? (
                                        <div className="w-full h-full bg-wood-dark/30 flex items-center justify-center">
                                            <Film className="w-6 h-6 text-wood-dark" />
                                        </div>
                                    ) : (
                                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                                    )}
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-primary-red border-2 border-wood-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-parchment" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    {(isFocused || content || files.length > 0) && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-dashed border-wood-dark/30">
                            <button
                                onClick={open}
                                className="p-2 text-wood-dark hover:bg-cork/50 border-2 border-wood-dark transition-colors"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2">
                                {(content || files.length > 0) && (
                                    <button
                                        onClick={() => { setContent(''); setFiles([]); setIsFocused(false); }}
                                        className="px-3 py-1 font-pixel text-xs text-wood-dark/70 hover:text-wood-dark hover:bg-cork/30 transition-colors"
                                    >
                                        CANCEL
                                    </button>
                                )}
                                <PixelButton
                                    onClick={handlePost}
                                    disabled={!canSubmit}
                                    size="sm"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <Send className="w-4 h-4" />
                                    PIN NOTE
                                </PixelButton>
                            </div>
                        </div>
                    )}
                </div>
            </WoodenFrame>
        </div>
    );
}

// Mock data for development
const mockPosts = [
    {
        id: '1',
        content: 'Hôm nay mình đi thử quán cà phê mới ở Tây Hồ, view siêu đẹp! Ai muốn đi cùng cuối tuần không? ☕✨',
        media: [
            {
                url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
                type: 'image' as const
            }
        ],
        author: {
            id: '101',
            email: 'minhanh@peerzee.com',
            display_name: 'Minh Anh',
            avatar: 'https://i.pravatar.cc/150?img=1'
        },
        score: 127,
        userVote: 0,
        likesCount: 127,
        isLiked: false,
        commentsCount: 23,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ['Cà phê', 'Hà Nội', 'Weekend']
    },
    {
        id: '2',
        content: 'Playlist mới của mình đây! Nhạc indie Việt nghe rất chill 🎵 Mọi người thử nghe xem sao nhé~',
        media: [],
        author: {
            id: '102',
            email: 'tuankiet@peerzee.com',
            display_name: 'Tuấn Kiệt',
            avatar: 'https://i.pravatar.cc/150?img=12'
        },
        score: 89,
        userVote: 1,
        likesCount: 89,
        isLiked: true,
        commentsCount: 15,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        tags: ['Music', 'Indie', 'Chill']
    },
    {
        id: '3',
        content: 'Sunset hôm nay đẹp quá! Ai ở Đà Nẵng cùng đi dạo biển không? 🌅',
        media: [
            {
                url: 'https://images.unsplash.com/photo-1495954222046-2c427ecb546d?w=800&q=80',
                type: 'image' as const
            }
        ],
        author: {
            id: '103',
            email: 'thuha@peerzee.com',
            display_name: 'Thu Hà',
            avatar: 'https://i.pravatar.cc/150?img=5'
        },
        score: 234,
        userVote: 1,
        likesCount: 234,
        isLiked: true,
        commentsCount: 41,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        tags: ['Sunset', 'Beach', 'Đà Nẵng']
    },
    {
        id: '4',
        content: 'Có ai thích đọc sách như mình không? Vừa đọc xong "Nhà Giả Kim", hay lắm! Recommend mọi người đọc 📚✨',
        media: [],
        author: {
            id: '104',
            email: 'hoanglong@peerzee.com',
            display_name: 'Hoàng Long',
            avatar: 'https://i.pravatar.cc/150?img=8'
        },
        score: 156,
        userVote: 0,
        likesCount: 156,
        isLiked: false,
        commentsCount: 67,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        tags: ['Books', 'Reading', 'Recommend']
    },
    {
        id: '5',
        content: 'Hôm nay vừa hoàn thành dự án lớn! Cảm giác thật tuyệt 🎉 Ai muốn chia sẻ kinh nghiệm làm việc không?',
        media: [
            {
                url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
                type: 'image' as const
            }
        ],
        author: {
            id: '105',
            email: 'lananh@peerzee.com',
            display_name: 'Lan Anh',
            avatar: 'https://i.pravatar.cc/150?img=20'
        },
        score: 93,
        userVote: 0,
        likesCount: 93,
        isLiked: false,
        commentsCount: 28,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        tags: ['Work', 'Success', 'Career']
    },
    {
        id: '6',
        content: 'Cuối tuần đi Leo núi Ba Vì, ai cùng đi không nào? Khung cảnh tuyệt vời lắm! ⛰️🌲',
        media: [
            {
                url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
                type: 'image' as const
            }
        ],
        author: {
            id: '106',
            email: 'quanghuy@peerzee.com',
            display_name: 'Quang Huy',
            avatar: 'https://i.pravatar.cc/150?img=15'
        },
        score: 178,
        userVote: 1,
        likesCount: 178,
        isLiked: true,
        commentsCount: 52,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        tags: ['Travel', 'Hiking', 'Nature']
    }
];

/**
 * CommunityFeedNotion - Village themed community feed
 * "Town Square Notices" - Where villagers share their adventures
 */
export default function CommunityFeedNotion() {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [useMockData, setUseMockData] = useState(false);

    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = usePosts();
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token) { 
            // Use mock data if not logged in
            setUseMockData(true);
            setCurrentUserId('demo-user');
            return;
        }
        setCurrentUserId(userId);
    }, [router]);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage && !useMockData) fetchNextPage();
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, useMockData]);

    if (isLoading && !useMockData) {
        return (
            <div>
                {/* Loading Skeleton - Village Style */}
                <WoodenFrame className="mb-6">
                    <div className="p-6">
                        <div className="h-6 w-32 bg-cork/50 mb-4 animate-pulse" />
                        <div className="h-20 bg-cork/30 animate-pulse" />
                    </div>
                </WoodenFrame>
                {[1, 2, 3].map(i => <PostCardNotionSkeleton key={i} />)}
            </div>
        );
    }

    const posts = useMockData ? mockPosts : (data?.posts ?? []);

    return (
        <div>
            {/* Create Post - Only show if logged in */}
            {!useMockData && <CreatePostNotion />}

            {/* Mock Data Banner - Village Notice Style */}
            {useMockData && (
                <div className="bg-accent-yellow/30 border-3 border-wood-dark p-4 mb-6 text-center">
                    <p className="font-pixel text-wood-dark text-sm uppercase flex items-center justify-center gap-2">
                        <Star className="w-4 h-4" />
                        DEMO MODE - SAMPLE POSTS
                        <Star className="w-4 h-4" />
                    </p>
                    <p className="text-wood-dark/70 text-xs mt-1">Login to create your own posts and interact</p>
                </div>
            )}

            {/* Error - Village Error Notice */}
            {isError && !useMockData && (
                <WoodenFrame>
                    <div className="bg-primary-red/20 border-b-3 border-primary-red px-4 py-2">
                        <p className="font-pixel text-primary-red text-sm">ERROR!</p>
                    </div>
                    <div className="p-6 text-center">
                        <p className="text-wood-dark text-sm mb-4">{error instanceof Error ? error.message : 'Failed to load posts'}</p>
                        <PixelButton onClick={() => refetch()} variant="secondary">
                            TRY AGAIN
                        </PixelButton>
                    </div>
                </WoodenFrame>
            )}

            {/* Posts */}
            {!isError && (
                <>
                    {posts.map(post => (
                        <PostCardNotion key={post.id} post={post} currentUserId={currentUserId || undefined} />
                    ))}

                    {hasNextPage && !useMockData && (
                        <div ref={loadMoreRef} className="py-6 flex justify-center">
                            {isFetchingNextPage && <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />}
                        </div>
                    )}

                    {isFetchingNextPage && !useMockData && <PostCardNotionSkeleton />}

                    {posts.length === 0 && !useMockData && (
                        <WoodenFrame>
                            <div className="p-8 text-center">
                                <p className="font-pixel text-wood-dark text-sm">NO POSTS YET</p>
                                <p className="text-wood-dark/70 text-xs mt-2">Be the first to share something!</p>
                            </div>
                        </WoodenFrame>
                    )}

                    {!hasNextPage && posts.length > 0 && !useMockData && (
                        <div className="text-center py-8">
                            <p className="font-pixel text-wood-dark/50 text-xs">✨ END OF NOTICES ✨</p>
                        </div>
                    )}

                    {useMockData && posts.length > 0 && (
                        <div className="text-center py-8">
                            <p className="font-pixel text-wood-dark/50 text-xs mb-4">✨ END OF DEMO ✨</p>
                            <PixelButton onClick={() => router.push('/login')}>
                                LOGIN TO CONTINUE
                            </PixelButton>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
