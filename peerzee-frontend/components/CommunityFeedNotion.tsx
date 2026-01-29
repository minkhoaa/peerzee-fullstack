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
        <div {...getRootProps()} className="bg-retro-white border-3 border-cocoa rounded-xl p-5 shadow-pixel mb-5">
            <input {...getInputProps()} />

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="What's on your mind?"
                className="w-full bg-retro-paper text-cocoa placeholder-cocoa-light rounded-lg px-5 py-3 resize-none outline-none text-sm leading-relaxed min-h-[48px] focus:ring-2 focus:ring-pixel-pink border-2 border-cocoa shadow-pixel-inset transition-all font-bold"
                disabled={isSubmitting}
            />

            {/* File Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                    {files.map((file, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-cocoa shadow-pixel-sm">
                            {file.type.startsWith('video/') ? (
                                <div className="w-full h-full bg-pixel-purple/30 flex items-center justify-center">
                                    <Film className="w-6 h-6 text-cocoa" />
                                </div>
                            ) : (
                                <img src={file.preview} alt="" className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1.5 right-1.5 p-1 bg-pixel-red border border-cocoa rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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
                        className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/30 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        {(content || files.length > 0) && (
                            <button
                                onClick={() => { setContent(''); setFiles([]); setIsFocused(false); }}
                                className="px-4 py-2 text-sm font-bold text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/20 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handlePost}
                            disabled={!canSubmit}
                            className={`px-4 py-2 text-sm font-pixel uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 border-2 ${canSubmit
                                ? 'bg-pixel-pink border-cocoa text-cocoa hover:bg-pixel-pink-dark shadow-pixel-sm active:translate-y-0.5 active:shadow-none'
                                : 'bg-retro-bg border-cocoa/30 text-cocoa-light cursor-not-allowed'
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
                <div className="bg-retro-white border-3 border-cocoa rounded-xl p-5 shadow-pixel mb-5">
                    <div className="h-16 bg-pixel-blue/30 rounded-lg animate-pulse" />
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
                <div className="text-center py-8 bg-retro-white border-3 border-cocoa rounded-xl p-6 shadow-pixel">
                    <p className="text-pixel-red text-sm font-bold mb-3">{error instanceof Error ? error.message : 'Failed'}</p>
                    <button onClick={() => refetch()} className="px-4 py-2 text-sm font-pixel uppercase tracking-wider text-cocoa hover:bg-pixel-blue/20 rounded-lg border-2 border-cocoa transition-colors">
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
                            {isFetchingNextPage && <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />}
                        </div>
                    )}

                    {isFetchingNextPage && <PostCardNotionSkeleton />}

                    {posts.length === 0 && (
                        <div className="text-center py-12 bg-retro-white border-3 border-cocoa rounded-xl p-8 shadow-pixel">
                            <p className="text-cocoa font-bold text-sm">No posts yet. Be the first! 🎉</p>
                        </div>
                    )}

                    {!hasNextPage && posts.length > 0 && (
                        <div className="text-center py-8">
                            <p className="text-cocoa-light text-xs font-bold">You've reached the end ✨</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
