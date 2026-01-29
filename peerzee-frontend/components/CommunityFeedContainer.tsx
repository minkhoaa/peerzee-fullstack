'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';
import { useDropzone } from 'react-dropzone';
import { Plus, X, Loader2, ImageIcon, Film, Upload } from 'lucide-react';

import PostCard, { PostCardNotionSkeleton as PostCardSkeleton } from './PostCardNotion';
import { useCreatePost, usePosts } from '@/hooks/usePosts';
import { MediaItem, communityApi, CreatePostDto } from '@/lib/communityApi';

// Available tags for selection
const AVAILABLE_TAGS = [
    'Programming', 'English', 'LookingForTeammate', 'Design', 'Career', 'Question', 'Help', 'Discussion'
];

interface FilePreview extends File {
    preview: string;
}

function CreatePostInput() {
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showTagPicker, setShowTagPicker] = useState(false);
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const createPostMutation = useCreatePost();

    // Dropzone configuration
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file =>
            Object.assign(file, {
                preview: URL.createObjectURL(file)
            })
        );
        setFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10 files
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
        noClick: true, // Prevent click on container
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

    // Cleanup previews on unmount
    useEffect(() => {
        return () => files.forEach(file => URL.revokeObjectURL(file.preview));
    }, [files]);

    const handlePost = async () => {
        if ((!content.trim() && files.length === 0) || isUploading || createPostMutation.isPending) return;

        try {
            let mediaItems: MediaItem[] = [];

            // Upload files if any
            if (files.length > 0) {
                setIsUploading(true);
                setUploadProgress(10);

                const uploadResult = await communityApi.uploadMedia(files);
                mediaItems = uploadResult.media;
                setUploadProgress(80);
            }

            // Create post
            const dto: CreatePostDto = {
                content: content.trim(),
                tags: selectedTags,
                media: mediaItems,
            };

            setUploadProgress(90);
            await createPostMutation.mutateAsync(dto);

            // Reset form
            setContent('');
            setSelectedTags([]);
            setShowTagPicker(false);
            files.forEach(file => URL.revokeObjectURL(file.preview));
            setFiles([]);
            setUploadProgress(100);
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const isSubmitting = isUploading || createPostMutation.isPending;
    const canSubmit = (content.trim() || files.length > 0) && !isSubmitting;

    return (
        <div
            {...getRootProps()}
            className={`bg-retro-white rounded-xl border-3 shadow-pixel transition-colors p-4 mb-6 ${isDragActive ? 'border-pixel-blue bg-pixel-blue/10' : 'border-cocoa'
                }`}
        >
            <input {...getInputProps()} />

            {/* Drag overlay */}
            {isDragActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-retro-white/90 rounded-xl z-10">
                    <div className="text-center">
                        <Upload className="w-8 h-8 text-pixel-blue mx-auto mb-2" />
                        <p className="text-cocoa text-sm font-bold">Drop files here</p>
                    </div>
                </div>
            )}

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-retro-paper text-cocoa placeholder-cocoa-light resize-none outline-none text-[15px] leading-relaxed min-h-[80px] rounded-lg p-3 border-2 border-cocoa shadow-pixel-inset font-medium"
                rows={3}
                disabled={isSubmitting}
            />

            {/* File Previews */}
            {files.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3 pb-3 border-b-2 border-cocoa/30">
                    {files.map((file, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-retro-paper border-2 border-cocoa">
                            {file.type.startsWith('video/') ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Film className="w-8 h-8 text-cocoa-light" />
                                    <span className="absolute bottom-1 left-1 text-[10px] text-cocoa bg-retro-white/80 px-1 rounded font-bold">
                                        Video
                                    </span>
                                </div>
                            ) : (
                                <img
                                    src={file.preview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute top-1 right-1 p-1 bg-pixel-red rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-cocoa"
                            >
                                <X className="w-3 h-3 text-retro-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
                <div className="mt-3">
                    <div className="h-2 bg-retro-paper rounded-lg overflow-hidden border border-cocoa">
                        <div
                            className="h-full bg-pixel-blue transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-cocoa-light mt-1 font-medium">Uploading... {uploadProgress}%</p>
                </div>
            )}

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pb-3 border-b-2 border-cocoa/30">
                    {selectedTags.map(tag => (
                        <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-pixel-yellow text-cocoa text-xs rounded-lg border border-cocoa font-bold"
                        >
                            #{tag}
                            <button
                                onClick={() => toggleTag(tag)}
                                className="hover:text-pixel-red transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowTagPicker(!showTagPicker)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/20 rounded-lg border-2 border-transparent hover:border-cocoa font-bold transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Topic
                    </button>
                    <button
                        onClick={open}
                        className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                        title="Attach media"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    {files.length > 0 && (
                        <span className="text-xs text-cocoa-light font-medium">
                            {files.length} file{files.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                <button
                    onClick={handlePost}
                    disabled={!canSubmit}
                    className={`px-4 py-1.5 text-sm font-bold rounded-lg border-2 transition-colors flex items-center gap-2 ${canSubmit
                        ? 'text-cocoa border-cocoa bg-pixel-pink hover:bg-pixel-pink-dark shadow-pixel-sm active:translate-y-0.5 active:shadow-none'
                        : 'text-cocoa-light border-cocoa-light/50 cursor-not-allowed'
                        }`}
                >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Post
                </button>
            </div>

            {/* Tag Picker */}
            {showTagPicker && (
                <div className="mt-3 pt-3 border-t-2 border-cocoa/30">
                    <p className="text-xs text-cocoa-light mb-2 font-pixel uppercase tracking-wider">Select topics</p>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 text-xs rounded-lg border-2 transition-colors font-bold ${selectedTags.includes(tag)
                                    ? 'border-cocoa text-cocoa bg-pixel-yellow'
                                    : 'border-cocoa-light text-cocoa-light hover:border-cocoa hover:text-cocoa hover:bg-pixel-blue/20'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error message */}
            {createPostMutation.isError && (
                <p className="mt-2 text-xs text-pixel-red font-bold">
                    Failed to create post. Please try again.
                </p>
            )}
        </div>
    );
}

export default function CommunityFeedContainer() {
    const router = useRouter();
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // TanStack Query infinite query
    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = usePosts();

    // Intersection observer for infinite scroll
    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
    });

    // Auth check
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token) {
            router.push('/login');
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentUserId(userId);
    }, [router]);

    // Fetch next page when load more trigger is in view
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Initial loading state
    if (isLoading) {
        return (
            <div className="px-4 py-6">
                <div className="bg-retro-white rounded-xl border-3 border-cocoa p-4 mb-6 h-32 animate-pulse" />
                {[1, 2, 3].map((i) => (
                    <PostCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    const posts = data?.posts ?? [];

    return (
        <div className="py-6 px-4">
            {/* Page Title */}
            <h1 className="text-cocoa font-pixel uppercase tracking-widest text-xl mb-6">Community Feed</h1>

            {/* Create Post */}
            <CreatePostInput />

            {/* Error State */}
            {isError && (
                <div className="text-center py-8 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                    <p className="text-pixel-red text-sm mb-4 font-bold">
                        {error instanceof Error ? error.message : 'Failed to load posts'}
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 text-sm text-cocoa bg-pixel-blue hover:bg-pixel-blue/80 rounded-lg border-2 border-cocoa font-bold shadow-pixel-sm active:translate-y-0.5 active:shadow-none transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Posts */}
            {!isError && (
                <div>
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUserId={currentUserId || undefined}
                        />
                    ))}

                    {/* Load More Trigger */}
                    {hasNextPage && (
                        <div ref={loadMoreRef} className="py-8 flex justify-center">
                            {isFetchingNextPage ? (
                                <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                            ) : (
                                <div className="h-1" />
                            )}
                        </div>
                    )}

                    {/* Loading more skeleton */}
                    {isFetchingNextPage && <PostCardSkeleton />}

                    {/* Empty State */}
                    {posts.length === 0 && !isLoading && (
                        <div className="text-center py-12 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                            <p className="text-cocoa-light text-sm font-medium">
                                No posts yet. Be the first to share something!
                            </p>
                        </div>
                    )}

                    {/* End of Feed */}
                    {!hasNextPage && posts.length > 0 && (
                        <div className="text-center py-8">
                            <p className="text-cocoa-light text-xs font-medium">You&apos;ve reached the end</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
