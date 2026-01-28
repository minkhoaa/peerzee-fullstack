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
        <article className="bg-[#FDF0F1] p-6 rounded-[30px] shadow-md shadow-[#CD6E67]/5 hover:shadow-lg hover:shadow-[#CD6E67]/10 transition-all mb-6 hover:-translate-y-1">
            <div className="flex gap-4">
                {/* Vote Strip - Reddit style */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <button
                        onClick={handleUpvote}
                        disabled={voteMutation.isPending}
                        className={`p-1.5 rounded-full transition-colors ${userVote === 1
                                ? 'text-white bg-[#CD6E67] shadow-sm'
                                : 'text-[#7A6862] hover:text-[#CD6E67] hover:bg-[#F3DDE0]'
                            }`}
                    >
                        <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className={`text-xs font-black min-w-[24px] text-center ${userVote === 1 ? 'text-[#CD6E67]' : userVote === -1 ? 'text-blue-500' : 'text-[#3E3229]'
                        }`}>
                        {score}
                    </span>
                    <button
                        onClick={handleDownvote}
                        disabled={voteMutation.isPending}
                        className={`p-1.5 rounded-full transition-colors ${userVote === -1
                                ? 'text-white bg-blue-500 shadow-sm'
                                : 'text-[#7A6862] hover:text-blue-500 hover:bg-[#F3DDE0]'
                            }`}
                    >
                        <ArrowDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#CD6E67] flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
                            {getInitials(displayName)}
                        </div>
                        <span className="text-[#3E3229] text-sm font-extrabold hover:underline cursor-pointer">
                            {displayName}
                        </span>
                        <span className="text-[#9CA3AF] text-xs">·</span>
                        <span className="text-[#7A6862] text-xs font-medium">{formatTimeAgo(post.createdAt)}</span>

                        {isAuthor && (
                            <div className="relative ml-auto">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-1.5 text-[#7A6862] hover:text-[#3E3229] hover:bg-[#F3DDE0] rounded-full transition-colors"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-8 z-20 bg-white rounded-[20px] shadow-lg shadow-[#CD6E67]/20 py-2 min-w-[120px]">
                                            <button
                                                onClick={handleDelete}
                                                disabled={deletePostMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 w-full transition-colors"
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
                    <p className="text-[#3E3229] text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
                        {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="text-[#CD6E67] text-xs font-bold hover:text-white hover:bg-[#CD6E67] px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                >
                                    #{tag.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Media */}
                    {post.media && post.media.length > 0 && (
                        <div className={`mb-4 grid gap-3 ${post.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {post.media.slice(0, 4).map((item, index) => (
                                <div key={index} className="relative rounded-[20px] overflow-hidden border-2 border-white shadow-sm aspect-video">
                                    {item.type === 'video' ? (
                                        <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />
                                    ) : (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {index === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-[#CD6E67]/80 flex items-center justify-center">
                                            <span className="text-white font-extrabold text-lg">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${showComments
                                ? 'bg-[#CD6E67] text-white shadow-md shadow-[#CD6E67]/30'
                                : 'bg-white text-[#CD6E67] hover:bg-[#F8E3E6]'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{localCommentsCount}</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white text-[#CD6E67] hover:bg-[#F8E3E6] transition-colors">
                            <Share className="w-4 h-4" />
                            <span>Share</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white text-[#CD6E67] hover:bg-[#F8E3E6] transition-colors">
                            <Bookmark className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="mt-5 ml-12 border-l-2 border-[#ECC8CD] pl-5">
                    {/* Input */}
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-3 mb-5">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-white border-none rounded-full text-[#3E3229] placeholder-[#9CA3AF] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#CD6E67] transition-all shadow-sm"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`p-2 rounded-full transition-all ${newComment.trim() && !isSubmitting
                                ? 'text-white bg-[#CD6E67] hover:bg-[#B55B55] shadow-sm'
                                : 'text-[#9CA3AF] bg-[#E5C0C5] cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-4">
                        {isLoadingComments ? (
                            <div className="flex items-center justify-center py-3">
                                <Loader2 className="w-5 h-5 text-[#CD6E67] animate-spin" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-[#7A6862] text-xs font-medium">No comments yet. Be the first!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-[#CD6E67] flex items-center justify-center text-white text-xs font-extrabold shrink-0 shadow-sm">
                                        {getInitials(comment.author.display_name || comment.author.email)}
                                    </div>
                                    <div className="flex-1 min-w-0 bg-white p-3 rounded-[20px] shadow-sm">
                                        <div className="flex items-center gap-2 text-xs mb-1">
                                            <span className="text-[#3E3229] font-extrabold">
                                                {comment.author.display_name || comment.author.email?.split('@')[0]}
                                            </span>
                                            <span className="text-[#9CA3AF]">·</span>
                                            <span className="text-[#7A6862] font-medium">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-[#3E3229] text-sm">{comment.content}</p>
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
        <div className="bg-[#FDF0F1] p-6 rounded-[30px] shadow-md shadow-[#CD6E67]/5 mb-6 animate-pulse">
            <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="w-8 h-8 bg-[#E5C0C5] rounded-full" />
                    <div className="w-6 h-4 bg-[#E5C0C5] rounded" />
                    <div className="w-8 h-8 bg-[#E5C0C5] rounded-full" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-[#E5C0C5] rounded-full" />
                        <div className="w-24 h-4 bg-[#E5C0C5] rounded-full" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-[#E5C0C5] rounded-full w-full" />
                        <div className="h-4 bg-[#E5C0C5] rounded-full w-3/4" />
                    </div>
                    <div className="flex gap-3">
                        <div className="w-20 h-8 bg-[#E5C0C5] rounded-full" />
                        <div className="w-20 h-8 bg-[#E5C0C5] rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
