'use client';

import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Share2, Plus, X, ImageIcon } from 'lucide-react';

// Types
interface PostTag {
    id: string;
    label: string;
}

interface Post {
    id: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    content: string;
    imageUrl?: string;
    tags: PostTag[];
    likes: number;
    comments: number;
    isLiked: boolean;
    createdAt: Date;
}

// Mock Data
const AVAILABLE_TAGS: PostTag[] = [
    { id: '1', label: 'Programming' },
    { id: '2', label: 'English' },
    { id: '3', label: 'LookingForTeammate' },
    { id: '4', label: 'Design' },
    { id: '5', label: 'Career' },
    { id: '6', label: 'Question' },
];

const MOCK_POSTS: Post[] = [
    {
        id: '1',
        author: { id: 'u1', name: 'Alex Chen' },
        content: 'Just finished my first TypeScript project! The type safety is amazing once you get used to it. Anyone else transitioning from JavaScript?',
        tags: [{ id: '1', label: 'Programming' }],
        likes: 24,
        comments: 8,
        isLiked: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    },
    {
        id: '2',
        author: { id: 'u2', name: 'Sarah Kim' },
        content: 'Looking for 2 developers to join our hackathon team. We\'re building a productivity app with Next.js and Supabase. DM if interested!',
        tags: [{ id: '3', label: 'LookingForTeammate' }, { id: '1', label: 'Programming' }],
        likes: 45,
        comments: 12,
        isLiked: true,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
    },
    {
        id: '3',
        author: { id: 'u3', name: 'Michael Tran' },
        content: 'Does anyone have recommendations for learning system design? I\'m preparing for senior engineer interviews.',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
        tags: [{ id: '6', label: 'Question' }, { id: '5', label: 'Career' }],
        likes: 18,
        comments: 23,
        isLiked: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1d ago
    },
    {
        id: '4',
        author: { id: 'u4', name: 'Emma Wilson' },
        content: 'Tip: Use CSS Grid for complex layouts and Flexbox for simple alignments. Both have their place in modern web development.',
        tags: [{ id: '4', label: 'Design' }, { id: '1', label: 'Programming' }],
        likes: 67,
        comments: 5,
        isLiked: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3d ago
    },
];

// Helper functions
function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Components
function CreatePostInput({ onPost }: { onPost: (content: string, tags: PostTag[]) => void }) {
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
    const [showTagPicker, setShowTagPicker] = useState(false);

    const handlePost = () => {
        if (!content.trim()) return;
        onPost(content, selectedTags);
        setContent('');
        setSelectedTags([]);
    };

    const toggleTag = (tag: PostTag) => {
        if (selectedTags.find(t => t.id === tag.id)) {
            setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const removeTag = (tagId: string) => {
        setSelectedTags(selectedTags.filter(t => t.id !== tagId));
    };

    return (
        <div className="bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel p-4 mb-6">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-retro-paper text-cocoa placeholder-cocoa-light resize-none outline-none text-[15px] leading-relaxed min-h-[80px] rounded-lg p-3 border-2 border-cocoa shadow-pixel-inset font-medium"
                rows={3}
            />

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pb-3 border-b-2 border-cocoa/30">
                    {selectedTags.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-pixel-yellow text-cocoa text-xs rounded-lg border border-cocoa font-bold"
                        >
                            #{tag.label}
                            <button
                                onClick={() => removeTag(tag.id)}
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
                    <button className="p-1.5 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors">
                        <ImageIcon className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={handlePost}
                    disabled={!content.trim()}
                    className={`px-4 py-1.5 text-sm font-bold rounded-lg border-2 transition-colors ${content.trim()
                        ? 'text-cocoa border-cocoa bg-pixel-pink hover:bg-pixel-pink-dark shadow-pixel-sm active:translate-y-0.5 active:shadow-none'
                        : 'text-cocoa-light border-cocoa-light/50 cursor-not-allowed'
                        }`}
                >
                    Post
                </button>
            </div>

            {/* Tag Picker Dropdown */}
            {showTagPicker && (
                <div className="mt-3 pt-3 border-t-2 border-cocoa/30">
                    <p className="text-xs text-cocoa-light mb-2 font-pixel uppercase tracking-wider">Select topics</p>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                key={tag.id}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 text-xs rounded-lg border-2 transition-colors font-bold ${selectedTags.find(t => t.id === tag.id)
                                    ? 'border-cocoa text-cocoa bg-pixel-yellow'
                                    : 'border-cocoa-light text-cocoa-light hover:border-cocoa hover:text-cocoa hover:bg-pixel-blue/20'
                                    }`}
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function FeedItem({ post, onLike }: { post: Post; onLike: (postId: string) => void }) {
    return (
        <article className="bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel p-4 mb-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-pixel-pink flex items-center justify-center text-cocoa text-sm font-bold border-2 border-cocoa">
                    {getInitials(post.author.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-cocoa font-bold text-sm">{post.author.name}</p>
                    <p className="text-cocoa-light text-xs font-medium">{formatTimeAgo(post.createdAt)}</p>
                </div>
            </div>

            {/* Content */}
            <div className="mb-3">
                <p className="text-cocoa text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {post.content}
                </p>
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="mb-3 rounded-lg overflow-hidden border-2 border-cocoa">
                    <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-auto object-cover max-h-[400px]"
                    />
                </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-pixel-yellow text-cocoa text-xs rounded-lg border border-cocoa font-bold"
                        >
                            #{tag.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-6 pt-3 border-t-2 border-cocoa/30">
                <button
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors font-bold ${post.isLiked
                        ? 'text-pixel-red'
                        : 'text-cocoa-light hover:text-cocoa'
                        }`}
                >
                    <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} strokeWidth={2.5} />
                    <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-cocoa-light hover:text-cocoa transition-colors font-bold">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-cocoa-light hover:text-cocoa transition-colors font-bold">
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </article>
    );
}

// Main Component
export default function CommunityFeed() {
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);

    const handlePost = (content: string, tags: PostTag[]) => {
        const newPost: Post = {
            id: Date.now().toString(),
            author: { id: 'current-user', name: 'You' },
            content,
            tags,
            likes: 0,
            comments: 0,
            isLiked: false,
            createdAt: new Date(),
        };
        setPosts([newPost, ...posts]);
    };

    const handleLike = (postId: string) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                };
            }
            return post;
        }));
    };

    return (
        <div className="min-h-screen bg-retro-bg">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-retro-white border-b-3 border-cocoa">
                <div className="max-w-[600px] mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-cocoa font-pixel uppercase tracking-widest text-lg">Community</h1>
                    <div className="flex items-center gap-2">
                        <a
                            href="/discover"
                            className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-pink/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                            title="Discover"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </a>
                        <a
                            href="/chat"
                            className="p-2 text-cocoa-light hover:text-cocoa hover:bg-pixel-blue/20 rounded-lg border-2 border-transparent hover:border-cocoa transition-colors"
                            title="Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </header>

            {/* Feed */}
            <main className="max-w-[600px] mx-auto px-4 py-6">
                <CreatePostInput onPost={handlePost} />

                <div className="space-y-0">
                    {posts.map(post => (
                        <FeedItem key={post.id} post={post} onLike={handleLike} />
                    ))}
                </div>

                {/* Empty State */}
                {posts.length === 0 && (
                    <div className="text-center py-12 bg-retro-white rounded-xl border-3 border-cocoa shadow-pixel">
                        <p className="text-cocoa-light text-sm font-medium">No posts yet. Be the first to share!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
