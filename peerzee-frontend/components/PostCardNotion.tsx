'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowDown, MessageCircle, Share, Bookmark, MoreHorizontal, Trash2, Send, Loader2, Heart } from 'lucide-react';
import { SocialPost, communityApi, type Comment } from '@/lib/communityApi';
import { useVote, useDeletePost } from '@/hooks/usePosts';
import { PushPin, CarvedInput } from './village';

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

/**
 * PostCardNotion - Village themed post card
 * Features: Push pins, wooden borders, medieval aesthetic
 */
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
        const newValue = userVote === 1 ? 0 : 1;
        voteMutation.mutate({ postId: post.id, value: newValue as 1 | 0 });
    }, [voteMutation, post.id, userVote]);

    const handleDownvote = useCallback(() => {
        if (voteMutation.isPending) return;
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
        <article className="relative bg-parchment border-3 border-wood-dark mb-6 hover:border-primary-orange transition-all">
            {/* Push Pin */}
            <div className="absolute -top-2 -left-2 z-10">
                <PushPin color={userVote === 1 ? 'red' : 'yellow'} />
            </div>
            
            <div className="flex">
                {/* Vote Strip */}
                <div className="flex flex-col items-center gap-1 p-3 bg-cork/30 border-r-3 border-wood-dark/30">
                    <button
                        onClick={handleUpvote}
                        disabled={voteMutation.isPending}
                        className={`p-2 border-2 transition-all ${userVote === 1
                            ? 'bg-accent-pink border-wood-dark text-parchment'
                            : 'bg-parchment border-wood-dark text-wood-dark hover:bg-accent-pink/30'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${userVote === 1 ? 'fill-parchment' : ''}`} />
                    </button>
                    <span className={`font-pixel text-sm min-w-[24px] text-center ${userVote === 1 ? 'text-accent-pink' : userVote === -1 ? 'text-accent-blue' : 'text-wood-dark'}`}>
                        {score}
                    </span>
                    <button
                        onClick={handleDownvote}
                        disabled={voteMutation.isPending}
                        className={`p-2 border-2 transition-all ${userVote === -1
                            ? 'bg-accent-blue border-wood-dark text-parchment'
                            : 'bg-parchment border-wood-dark text-wood-dark hover:bg-accent-blue/30'
                            }`}
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 p-4">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-primary-orange border-2 border-wood-dark flex items-center justify-center text-parchment font-pixel text-xs">
                            {getInitials(displayName)}
                        </div>
                        <span className="font-pixel text-wood-dark text-sm uppercase hover:text-primary-orange cursor-pointer transition-colors">
                            {displayName}
                        </span>
                        <span className="text-wood-dark/50 text-xs">·</span>
                        <span className="text-wood-dark/50 text-xs">{formatTimeAgo(post.createdAt)}</span>

                        {isAuthor && (
                            <div className="relative ml-auto">
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 text-wood-dark/50 hover:text-wood-dark hover:bg-cork/50 border-2 border-wood-dark transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                        <div className="absolute right-0 top-10 z-20 bg-parchment border-3 border-wood-dark py-1 min-w-[120px]">
                                            <button
                                                onClick={handleDelete}
                                                disabled={deletePostMutation.isPending}
                                                className="flex items-center gap-2 px-4 py-2 font-pixel text-xs text-primary-red uppercase hover:bg-primary-red/10 w-full transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                DELETE
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <p className="text-wood-dark text-sm leading-relaxed whitespace-pre-wrap break-words mb-3">
                        {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="bg-cork/50 text-wood-dark font-pixel text-xs uppercase px-2 py-1 border-2 border-wood-dark cursor-pointer hover:bg-primary-orange hover:text-parchment transition-colors"
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
                                <div key={index} className="relative border-3 border-wood-dark overflow-hidden aspect-video">
                                    {item.type === 'video' ? (
                                        <video src={item.url} className="w-full h-full object-cover" controls preload="metadata" />
                                    ) : (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                                    )}
                                    {index === 3 && post.media.length > 4 && (
                                        <div className="absolute inset-0 bg-wood-dark/80 flex items-center justify-center">
                                            <span className="font-pixel text-parchment text-lg">+{post.media.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap pt-3 border-t-2 border-dashed border-wood-dark/30">
                        <button
                            onClick={handleToggleComments}
                            className={`flex items-center gap-2 px-3 py-1.5 border-2 font-pixel text-xs uppercase transition-all ${showComments
                                ? 'bg-primary-orange border-wood-dark text-parchment'
                                : 'bg-parchment border-wood-dark text-wood-dark hover:bg-cork/50'
                                }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{localCommentsCount}</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border-2 border-wood-dark bg-parchment text-wood-dark hover:bg-accent-blue/30 font-pixel text-xs uppercase transition-all">
                            <Share className="w-4 h-4" />
                            <span>SHARE</span>
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 border-2 border-wood-dark bg-parchment text-wood-dark hover:bg-accent-yellow/30 font-pixel text-xs uppercase transition-all">
                            <Bookmark className="w-4 h-4" />
                            <span>SAVE</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            {showComments && (
                <div className="mx-4 mb-4 p-4 bg-cork/20 border-3 border-wood-dark">
                    {/* Input */}
                    <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-parchment border-3 border-wood-dark text-wood-dark placeholder-wood-dark/50 px-4 py-2 text-sm outline-none focus:border-primary-orange transition-all"
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className={`p-2 border-2 transition-all ${newComment.trim() && !isSubmitting
                                ? 'bg-primary-orange border-wood-dark text-parchment'
                                : 'bg-cork/50 border-wood-dark/50 text-wood-dark/50 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>

                    {/* List */}
                    <div className="space-y-3">
                        {isLoadingComments ? (
                            <div className="flex items-center justify-center py-3">
                                <Loader2 className="w-5 h-5 text-primary-orange animate-spin" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-wood-dark/50 text-xs text-center">No comments yet. Be the first!</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-7 h-7 bg-landscape-green border-2 border-wood-dark flex items-center justify-center text-parchment font-pixel text-xs shrink-0">
                                        {getInitials(comment.author.display_name || comment.author.email)}
                                    </div>
                                    <div className="flex-1 min-w-0 bg-parchment p-3 border-2 border-wood-dark">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-pixel text-xs text-wood-dark uppercase">
                                                {comment.author.display_name || comment.author.email?.split('@')[0]}
                                            </span>
                                            <span className="text-wood-dark/50 text-xs">·</span>
                                            <span className="text-wood-dark/50 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-wood-dark text-sm">{comment.content}</p>
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
        <div className="bg-parchment border-3 border-wood-dark mb-6 animate-pulse">
            <div className="flex">
                <div className="flex flex-col items-center gap-2 p-3 bg-cork/30 border-r-3 border-wood-dark/30">
                    <div className="w-8 h-8 bg-cork/50 border-2 border-wood-dark" />
                    <div className="w-6 h-4 bg-cork/50" />
                    <div className="w-8 h-8 bg-cork/50 border-2 border-wood-dark" />
                </div>
                <div className="flex-1 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 bg-cork/50 border-2 border-wood-dark" />
                        <div className="w-24 h-4 bg-cork/50" />
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-cork/50 w-full" />
                        <div className="h-4 bg-cork/50 w-3/4" />
                    </div>
                    <div className="flex gap-2">
                        <div className="w-20 h-8 bg-cork/50 border-2 border-wood-dark" />
                        <div className="w-20 h-8 bg-cork/50 border-2 border-wood-dark" />
                    </div>
                </div>
            </div>
        </div>
    );
}
