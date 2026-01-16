'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, MessageCircle, Share, Bookmark, MoreHorizontal, Trash2, Send, Loader2 } from 'lucide-react';
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
        <article className="border-b border-[#2F2F2F] py-4 hover:bg-[#1D1D1D] transition-colors -mx-2 px-2 rounded-md">
            <div className="flex gap-3">
                {/* Vote Strip - Reddit style */}
                <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
                    <button
                        onClick={handleUpvote}
                        disabled={voteMutation.isPending}
                        className={`p-1 rounded transition-colors ${userVote === 1
                                ? 'text-orange-500 bg-orange-500/10'
                                : 'text-[#9B9A97] hover:text-orange-500 hover:bg-[#2F2F2F]'
                            }`}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className={`text-xs font-medium min-w-[20px] text-center ${userVote === 1 ? 'text-orange-500' : userVote === -1 ? 'text-blue-500' : 'text-[#E3E3E3]'
                        }`}>
                        {score}
                    </span>
                    <button
                        onClick={handleDownvote}
                        disabled={voteMutation.isPending}
                        className={`p-1 rounded transition-colors ${userVote === -1
                                ? 'text-blue-500 bg-blue-500/10'
                                : 'text-[#9B9A97] hover:text-blue-500 hover:bg-[#2F2F2F]'
                            }`}
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded bg-[#37352F] flex items-center justify-center text-[#E3E3E3] text-[9px] font-medium">
                            {getInitials(displayName)}
                        </div>
                        <span className="text-[#E3E3E3] text-sm hover:underline cursor-pointer">
                            {displayName}
                        </span>
                        <span className="text-[#9B9A97] text-xs">·</span>
                        <span className="text-[#9B9A97] text-xs">{formatTimeAgo(post.createdAt)}</span>

                        {isAuthor && (
                            <div className="relative ml-auto">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1 text-[#9B9A97] hover:text-[#E3E3E3] hover:bg-[#2F2F2F] rounded transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-6 z-20 bg-[#252525] border border-[#2F2F2F] rounded-md shadow-lg py-1">
                                            <button
                                                onClick={handleDelete}
                                                disabled={deletePostMutation.isPending}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-[#2F2F2F] w-full"
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
                    <p className="text-[#E3E3E3] text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
                        {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-[#9B9A97] text-xs hover:text-[#E3E3E3] cursor-pointer transition-colors"
                                >
                                    #{tag.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                        <div className={`mb-3 grid gap-2 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.media.slice(0, 4).map((item, index) => (
                                <div key={index} className="relative rounded-md overflow-hidden border border-[#2F2F2F] aspect-video">
                                    {item.type === 'video' ? (
                                        <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />
                                    ) : (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {index === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-medium">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 -ml-1">
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${showComments
                                ? 'text-[#E3E3E3] bg-[#2F2F2F]'
                                : 'text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3]'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{localCommentsCount}</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3] transition-colors">
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                        <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#9B9A97] hover:bg-[#2F2F2F] hover:text-[#E3E3E3] transition-colors">
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="mt-4 ml-9 border-l border-[#2F2F2F] pl-4">
                    {/* Input */}
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-transparent border-b border-[#2F2F2F] focus:border-[#9B9A97] text-[#E3E3E3] placeholder-[#9B9A97] py-1.5 text-sm outline-none transition-colors"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`p-1.5 rounded transition-colors ${newComment.trim() && !isSubmitting
                                ? 'text-[#E3E3E3] hover:bg-[#2F2F2F]'
                                : 'text-[#9B9A97] cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        {isLoadingComments ? (
                            <Loader2 className="w-4 h-4 text-[#9B9A97] animate-spin" />
                        ) : comments.length === 0 ? (
                            <p className="text-[#9B9A97] text-xs">No comments yet</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-5 h-5 rounded bg-[#37352F] flex items-center justify-center text-[#E3E3E3] text-[8px] font-medium shrink-0">
                                        {getInitials(comment.author.display_name || comment.author.email)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <span className="text-[#E3E3E3]">
                                                {comment.author.display_name || comment.author.email?.split('@')[0]}
                                            </span>
                                            <span className="text-[#9B9A97]">·</span>
                                            <span className="text-[#9B9A97]">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-[#E3E3E3] text-sm mt-0.5">{comment.content}</p>
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
        <div className="border-b border-[#2F2F2F] py-4 animate-pulse">
            <div className="flex gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                    <div className="w-5 h-5 bg-[#2F2F2F] rounded" />
                    <div className="w-4 h-3 bg-[#2F2F2F] rounded" />
                    <div className="w-5 h-5 bg-[#2F2F2F] rounded" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 bg-[#2F2F2F] rounded" />
                        <div className="w-20 h-3 bg-[#2F2F2F] rounded" />
                    </div>
                    <div className="space-y-1.5 mb-3">
                        <div className="h-4 bg-[#2F2F2F] rounded w-full" />
                        <div className="h-4 bg-[#2F2F2F] rounded w-3/4" />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-5 bg-[#2F2F2F] rounded" />
                        <div className="w-12 h-5 bg-[#2F2F2F] rounded" />
                    </div>
                </div>
            </div>
        </div>
    );
}
