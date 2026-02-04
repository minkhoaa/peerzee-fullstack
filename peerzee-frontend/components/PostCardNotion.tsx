'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, MessageSquareText, Share, Bookmark, MoreHorizontal, Trash2, Send, Loader2 } from 'lucide-react';
import { SocialPost, communityApi, type Comment } from '@/lib/communityApi';
import { useVote, useDeletePost } from '@/hooks/usePosts';

interface PostCardNotionProps {
    post: SocialPost;
    currentUserId?: string;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function PostCardNotion({ post, currentUserId }: PostCardNotionProps) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);
    const inputRef = useRef<HTMLInputElement>(null);

    const voteMutation = useVote();
    const deletePostMutation = useDeletePost();

    const displayName = post.author.display_name || post.author.email?.split('@')[0] || 'Unknown';
    const isAuthor = currentUserId === post.author.id;

    // Navigate to author's profile
    const handleViewProfile = useCallback(() => {
        router.push(`/profile/${post.author.id}`);
    }, [router, post.author.id]);

    // Reddit-style voting: userVote is 1 (up), -1 (down), or 0 (none)
    const userVote = post.userVote || 0;
    const score = post.score ?? post.likesCount ?? 0;

    const handleUpvote = useCallback(() => {
        if (voteMutation.isPending) return;
        // If already upvoted, unvote (toggle); otherwise upvote
        const newValue = userVote === 1 ? 0 : 1;
        voteMutation.mutate({ postId: post.id, value: newValue as 1 | 0 });
    }, [voteMutation, post.id, userVote]);

    const handleDownvote = useCallback(() => {
        if (voteMutation.isPending) return;
        // If already downvoted, unvote (toggle); otherwise downvote
        const newValue = userVote === -1 ? 0 : -1;
        voteMutation.mutate({ postId: post.id, value: newValue as -1 | 0 });
    }, [voteMutation, post.id, userVote]);

    const handleDelete = useCallback(() => {
        if (!confirm('Delete this post?')) return;
        deletePostMutation.mutate(post.id);
        setShowMenu(false);
    }, [deletePostMutation, post.id]);

    const loadComments = useCallback(async () => {
        if (isLoadingComments) return;
        setIsLoadingComments(true);
        try {
            const response = await communityApi.getComments(post.id, undefined, 5);
            setComments(response.comments);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoadingComments(false);
        }
    }, [post.id, isLoadingComments]);

    const handleToggleComments = useCallback(() => {
        if (!showComments && comments.length === 0) loadComments();
        setShowComments(!showComments);
    }, [showComments, comments.length, loadComments]);

    useEffect(() => {
        if (showComments && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [showComments]);

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const response = await communityApi.addComment(post.id, newComment.trim());
            setComments(prev => [...prev, response.comment]);
            setNewComment('');
            setLocalCommentsCount(prev => prev + 1);
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <article className="bg-retro-white p-5 border-3 border-cocoa rounded-xl shadow-pixel hover:shadow-pixel-lg transition-all mb-5 hover:-translate-y-1">
            <div className="flex gap-4">
                {/* Vote Strip - Reddit style */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <button
                        onClick={handleUpvote}
                        disabled={voteMutation.isPending}
                        className={`p-1.5 rounded-lg border-2 transition-colors ${userVote === 1
                                ? 'text-cocoa bg-pixel-pink border-cocoa shadow-pixel-sm'
                                : 'text-cocoa-light border-transparent hover:text-cocoa hover:bg-pixel-pink/30 hover:border-cocoa'
                            }`}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className={`text-xs font-pixel min-w-[24px] text-center ${userVote === 1 ? 'text-pixel-pink' : userVote === -1 ? 'text-pixel-blue' : 'text-cocoa'
                        }`}>
                        {score}
                    </span>
                    <button
                        onClick={handleDownvote}
                        disabled={voteMutation.isPending}
                        className={`p-1.5 rounded-lg border-2 transition-colors ${userVote === -1
                                ? 'text-cocoa bg-pixel-blue border-cocoa shadow-pixel-sm'
                                : 'text-cocoa-light border-transparent hover:text-cocoa hover:bg-pixel-blue/30 hover:border-cocoa'
                            }`}
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <button
                            onClick={handleViewProfile}
                            className="w-8 h-8 rounded-lg bg-pixel-pink border-2 border-cocoa flex items-center justify-center text-cocoa text-xs font-pixel shadow-pixel-sm hover:bg-pixel-yellow transition-colors"
                        >
                            {getInitials(displayName)}
                        </button>
                        <button
                            onClick={handleViewProfile}
                            className="text-cocoa text-sm font-bold hover:underline hover:text-pixel-pink transition-colors"
                        >
                            {displayName}
                        </button>
                        <span className="text-cocoa-light text-xs">·</span>
                        <span className="text-cocoa-light text-xs font-bold">{formatTimeAgo(post.createdAt)}</span>

                        {isAuthor && (
                            <div className="relative ml-auto">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/30 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-8 z-20 bg-retro-white border-3 border-cocoa rounded-xl shadow-pixel py-2 min-w-[120px]">
                                            <button
                                                onClick={handleDelete}
                                                disabled={deletePostMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-pixel-red hover:bg-pixel-red/10 w-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <p className="text-cocoa text-sm leading-relaxed whitespace-pre-wrap break-words mb-3 font-bold">
                        {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-cocoa text-xs font-bold bg-pixel-yellow hover:bg-pixel-pink px-2 py-1 rounded-md border border-cocoa cursor-pointer transition-colors"
                                >
                                    #{tag.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                        <div className={`mb-4 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.media.slice(0, 4).map((item, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden border-2 border-cocoa shadow-pixel-sm aspect-video">
                                    {item.type === 'video' ? (
                                        <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />
                                    ) : (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {index === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-cocoa/80 flex items-center justify-center">
                                            <span className="text-retro-white font-pixel text-lg">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 ${showComments
                                ? 'bg-pixel-pink border-cocoa text-cocoa shadow-pixel-sm'
                                : 'bg-retro-paper border-cocoa text-cocoa hover:bg-pixel-blue/30'
                                }`}
                        >
                            <MessageSquareText className="w-4 h-4" strokeWidth={2.5} />
                            <span>{localCommentsCount}</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-retro-paper border-2 border-cocoa text-cocoa hover:bg-pixel-purple/30 transition-colors">
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-retro-paper border-2 border-cocoa text-cocoa hover:bg-pixel-yellow/30 transition-colors">
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="mt-5 ml-12 border-l-3 border-cocoa/30 pl-5">
                    {/* Input */}
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-retro-white border-2 border-cocoa rounded-lg text-cocoa placeholder-cocoa-light px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pixel-pink transition-all shadow-pixel-inset font-bold"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`p-2 rounded-lg border-2 transition-all ${newComment.trim() && !isSubmitting
                                ? 'text-cocoa bg-pixel-pink border-cocoa hover:bg-pixel-pink-dark shadow-pixel-sm active:translate-y-0.5 active:shadow-none'
                                : 'text-cocoa-light bg-retro-bg border-cocoa/30 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        {isLoadingComments ? (
                            <div className="flex items-center justify-center py-3">
                                <Loader2 className="w-5 h-5 text-pixel-pink animate-spin" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-cocoa-light text-xs font-bold">No comments yet. Be the first!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-pixel-purple border-2 border-cocoa flex items-center justify-center text-cocoa text-xs font-pixel shrink-0">
                                        {getInitials(comment.author.display_name || comment.author.email)}
                                    </div>
                                    <div className="flex-1 min-w-0 bg-retro-paper p-3 rounded-lg border-2 border-cocoa shadow-pixel-sm">
                                        <div className="flex items-center gap-2 text-xs mb-1">
                                            <span className="text-cocoa font-bold">
                                                {comment.author.display_name || comment.author.email?.split('@')[0]}
                                            </span>
                                            <span className="text-cocoa-light">·</span>
                                            <span className="text-cocoa-light font-bold">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-cocoa text-sm font-bold">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </article>
    );
}

export function PostCardNotionSkeleton() {
    return (
        <div className="bg-retro-white p-5 border-3 border-cocoa rounded-xl shadow-pixel mb-5 animate-pulse">
            <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="w-8 h-8 bg-pixel-blue/30 rounded-lg" />
                    <div className="w-6 h-4 bg-pixel-blue/30 rounded" />
                    <div className="w-8 h-8 bg-pixel-blue/30 rounded-lg" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-pixel-pink/30 rounded-lg" />
                        <div className="w-24 h-4 bg-pixel-blue/30 rounded-lg" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-pixel-blue/30 rounded-lg w-full" />
                        <div className="h-4 bg-pixel-blue/30 rounded-lg w-3/4" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-20 h-8 bg-pixel-blue/30 rounded-lg" />
                        <div className="w-20 h-8 bg-pixel-blue/30 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
