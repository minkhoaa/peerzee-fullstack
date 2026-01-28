'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, X, Loader2, Film } from 'lucide-react';
import { usePosts, useCreatePost } from '@/hooks/usePosts';
import { communityApi, type MediaItem } from '@/lib/communityApi';
import PostCardNotion, { PostCardNotionSkeleton } from './PostCardNotion';

interface FilePreview extends File {
    preview: string;
}

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
        <div {...getRootProps()} className="bg-[#FDF0F1] rounded-[30px] p-5 shadow-md shadow-[#CD6E67]/5 mb-6">
            <input {...getInputProps()} />

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="What's on your mind?"
                className="w-full bg-white text-[#3E3229] placeholder-[#9CA3AF] rounded-full px-6 py-3 resize-none outline-none text-sm leading-relaxed min-h-[48px] focus:ring-2 focus:ring-[#CD6E67] border-none shadow-inner transition-all"
                disabled={isSubmitting}
            />

            {/* File Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                    {files.map((file, index) => (
                        <div key={index} className="relative group aspect-square rounded-[15px] overflow-hidden border-2 border-white shadow-sm">
                            {file.type.startsWith('video/') ? (
                                <div className="w-full h-full bg-[#F3DDE0] flex items-center justify-center">
                                    <Film className="w-6 h-6 text-[#CD6E67]" />
                                </div>
                            ) : (
                                <img src={file.preview} alt="" className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1.5 right-1.5 p-1 bg-[#CD6E67] rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions - Show when focused or has content */}
            {(isFocused || content || files.length > 0) && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={open}
                        className="p-2 text-[#7A6862] hover:text-[#CD6E67] hover:bg-[#F3DDE0] rounded-full transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        {(content || files.length > 0) && (
                            <button
                                onClick={() => { setContent(''); setFiles([]); setIsFocused(false); }}
                                className="px-4 py-2 text-sm font-bold text-[#7A6862] hover:text-[#3E3229] hover:bg-[#F3DDE0] rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handlePost}
                            disabled={!canSubmit}
                            className={`px-4 py-2 text-sm font-bold rounded-full transition-all flex items-center gap-2 shadow-sm ${canSubmit
                                ? 'bg-[#CD6E67] text-white hover:bg-[#B55B55] shadow-[#CD6E67]/30'
                                : 'bg-[#E5C0C5] text-[#9CA3AF] cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Post
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function CommunityFeedNotion() {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const { data, isLoading, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = usePosts();
    const { ref: loadMoreRef, inView } = useInView({ threshold: 0.1 });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        if (!token) { router.push('/login'); return; }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUserId(userId);
    }, [router]);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isLoading) {
        return (
            <div>
                <div className="bg-[#FDF0F1] rounded-[30px] p-5 shadow-md shadow-[#CD6E67]/5 mb-6">
                    <div className="h-16 bg-[#E5C0C5] rounded-full animate-pulse" />
                </div>
                {[1, 2, 3].map(i => <PostCardNotionSkeleton key={i} />)}
            </div>
        );
    }

    const posts = data?.posts ?? [];

    return (
        <div>
            {/* Create Post */}
            <CreatePostNotion />

            {/* Error */}
            {isError && (
                <div className="text-center py-8 bg-[#FDF0F1] rounded-[30px] p-6">
                    <p className="text-red-500 text-sm font-medium mb-3">{error instanceof Error ? error.message : 'Failed'}</p>
                    <button onClick={() => refetch()} className="px-4 py-2 text-sm font-bold text-[#CD6E67] hover:bg-[#F3DDE0] rounded-full transition-colors">
                        Try again
                    </button>
                </div>
            )}

            {/* Posts */}
            {!isError && (
                <>
                    {posts.map(post => (
                        <PostCardNotion key={post.id} post={post} currentUserId={currentUserId || undefined} />
                    ))}

                    {hasNextPage && (
                        <div ref={loadMoreRef} className="py-6 flex justify-center">
                            {isFetchingNextPage && <Loader2 className="w-4 h-4 text-[#9B9A97] animate-spin" />}
                        </div>
                    )}

                    {isFetchingNextPage && <PostCardNotionSkeleton />}

                    {posts.length === 0 && (
                        <div className="text-center py-12 bg-[#FDF0F1] rounded-[30px] p-8">
                            <p className="text-[#7A6862] text-sm font-medium">No posts yet. Be the first!</p>
                        </div>
                    )}

                    {!hasNextPage && posts.length > 0 && (
                        <div className="text-center py-8">
                            <p className="text-[#7A6862] text-xs font-medium">You've reached the end ✨</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
