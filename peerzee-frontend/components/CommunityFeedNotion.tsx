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
        <div {...getRootProps()} className="border-b border-[#2F2F2F] pb-4 mb-4">
            <input {...getInputProps()} />

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Write something..."
                className="w-full bg-transparent text-[#E3E3E3] placeholder-[#9B9A97] resize-none outline-none text-sm leading-relaxed min-h-[60px]"
                disabled={isSubmitting}
            />

            {/* File Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                    {files.map((file, index) => (
                        <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-[#2F2F2F]">
                            {file.type.startsWith('video/') ? (
                                <div className="w-full h-full bg-[#202020] flex items-center justify-center">
                                    <Film className="w-6 h-6 text-[#9B9A97]" />
                                </div>
                            ) : (
                                <img src={file.preview} alt="" className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-0.5 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions - Show when focused or has content */}
            {(isFocused || content || files.length > 0) && (
                <div className="flex items-center justify-between mt-3">
                    <button
                        onClick={open}
                        className="p-1.5 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        {(content || files.length > 0) && (
                            <button
                                onClick={() => { setContent(''); setFiles([]); setIsFocused(false); }}
                                className="px-3 py-1 text-xs text-[#9B9A97] hover:text-[#E3E3E3] transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handlePost}
                            disabled={!canSubmit}
                            className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1.5 ${canSubmit
                                ? 'bg-[#2F2F2F] text-[#E3E3E3] hover:bg-[#37352F]'
                                : 'text-[#9B9A97] cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
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
                <div className="border-b border-[#2F2F2F] pb-4 mb-4">
                    <div className="h-16 bg-[#202020] rounded animate-pulse" />
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
                <div className="text-center py-8">
                    <p className="text-red-400 text-sm mb-2">{error instanceof Error ? error.message : 'Failed'}</p>
                    <button onClick={() => refetch()} className="text-[#9B9A97] text-sm hover:text-[#E3E3E3]">
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
                        <div className="text-center py-12">
                            <p className="text-[#9B9A97] text-sm">No posts yet. Be the first!</p>
                        </div>
                    )}

                    {!hasNextPage && posts.length > 0 && (
                        <div className="text-center py-8">
                            <p className="text-[#9B9A97] text-xs">End of feed</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
