'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Share2, Plus, X, ImageIcon, Sparkles } from 'lucide-react';

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

// Components - ToyWorld styled
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[30px] border-2 border-[#ECC8CD]/40 p-5 mb-6 shadow-lg shadow-[#CD6E67]/10"
        >
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? ✨"
                className="w-full bg-transparent text-[#3E3229] placeholder-[#7A6862] resize-none outline-none text-[15px] leading-relaxed min-h-[80px] font-medium"
                rows={3}
            />

            {/* Selected Tags */}
            <AnimatePresence>
                {selectedTags.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mt-3 pb-3 border-b-2 border-[#ECC8CD]/30"
                    >
                        {selectedTags.map(tag => (
                            <motion.span
                                key={tag.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-[#CD6E67]/10 text-[#CD6E67] text-xs rounded-full font-semibold"
                            >
                                #{tag.label}
                                <button
                                    onClick={() => removeTag(tag.id)}
                                    className="hover:text-[#B85C55] transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTagPicker(!showTagPicker)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs text-[#7A6862] hover:text-[#CD6E67] bg-[#FDF0F1] hover:bg-[#ECC8CD]/30 rounded-full transition-colors font-semibold"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Topic
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-[#7A6862] hover:text-[#CD6E67] bg-[#FDF0F1] hover:bg-[#ECC8CD]/30 rounded-full transition-colors"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </motion.button>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePost}
                    disabled={!content.trim()}
                    className={`px-6 py-2 text-sm font-bold rounded-full transition-all ${content.trim()
                        ? 'bg-[#CD6E67] text-white hover:bg-[#B85C55] shadow-md shadow-[#CD6E67]/30'
                        : 'bg-[#ECC8CD]/30 text-[#7A6862] cursor-not-allowed'
                        }`}
                >
                    Post
                </motion.button>
            </div>

            {/* Tag Picker Dropdown */}
            <AnimatePresence>
                {showTagPicker && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t-2 border-[#ECC8CD]/30"
                    >
                        <p className="text-xs text-[#7A6862] mb-3 font-medium">Select topics</p>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map(tag => (
                                <motion.button
                                    key={tag.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-4 py-1.5 text-xs rounded-full border-2 transition-all font-semibold ${selectedTags.find(t => t.id === tag.id)
                                        ? 'border-[#CD6E67] text-[#CD6E67] bg-[#CD6E67]/10'
                                        : 'border-[#ECC8CD]/40 text-[#7A6862] hover:border-[#CD6E67]/50 hover:text-[#CD6E67]'
                                        }`}
                                >
                                    {tag.label}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function FeedItem({ post, onLike, index }: { post: Post; onLike: (postId: string) => void; index: number }) {
    return (
        <motion.article 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-[30px] border-2 border-[#ECC8CD]/40 p-5 mb-4 shadow-lg shadow-[#CD6E67]/10"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CD6E67] to-[#E88B85] flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {getInitials(post.author.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[#3E3229] font-nunito font-bold text-sm">{post.author.name}</p>
                    <p className="text-[#7A6862] text-xs">{formatTimeAgo(post.createdAt)}</p>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4">
                <p className="text-[#3E3229] text-[15px] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </p>
            </div>

            {/* Image */}
            {post.imageUrl && (
                <div className="mb-4 rounded-[20px] overflow-hidden border-2 border-[#ECC8CD]/30">
                    <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-auto object-cover max-h-[400px]"
                    />
                </div>
            )}

            {/* Tags - candy styled */}
            {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                        <span
                            key={tag.id}
                            className="px-3 py-1 bg-[#FDF0F1] text-[#CD6E67] text-xs rounded-full font-semibold border border-[#ECC8CD]/30"
                        >
                            #{tag.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-6 pt-4 border-t-2 border-[#ECC8CD]/30">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked
                        ? 'text-[#CD6E67]'
                        : 'text-[#7A6862] hover:text-[#CD6E67]'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="font-semibold">{post.likes}</span>
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 text-sm text-[#7A6862] hover:text-[#3E3229] transition-colors"
                >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold">{post.comments}</span>
                </motion.button>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1.5 text-sm text-[#7A6862] hover:text-[#3E3229] transition-colors"
                >
                    <Share2 className="w-5 h-5" />
                </motion.button>
            </div>
        </motion.article>
    );
}

// Main Component - ToyWorld styled
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
        <div className="min-h-screen bg-[#ECC8CD]">
            {/* Header - ToyWorld styled */}
            <header className="sticky top-0 z-10 bg-[#FDF0F1]/95 backdrop-blur-md border-b-4 border-[#ECC8CD]/40 shadow-lg shadow-[#CD6E67]/10">
                <div className="max-w-[600px] mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🧸</span>
                        <h1 className="text-[#3E3229] text-lg font-nunito font-bold">Community</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            href="/discover"
                            className="p-2 text-[#7A6862] hover:text-[#CD6E67] bg-white hover:bg-[#FDF0F1] rounded-full transition-colors shadow-sm"
                            title="Discover"
                        >
                            <Heart className="w-5 h-5" />
                        </motion.a>
                        <motion.a
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            href="/chat"
                            className="p-2 text-[#7A6862] hover:text-[#CD6E67] bg-white hover:bg-[#FDF0F1] rounded-full transition-colors shadow-sm"
                            title="Chat"
                        >
                            <MessageSquare className="w-5 h-5" />
                        </motion.a>
                    </div>
                </div>
            </header>

            {/* Feed */}
            <main className="max-w-[600px] mx-auto px-4 py-6">
                <CreatePostInput onPost={handlePost} />

                <div className="space-y-0">
                    {posts.map((post, index) => (
                        <FeedItem key={post.id} post={post} onLike={handleLike} index={index} />
                    ))}
                </div>

                {/* Empty State - ToyWorld styled */}
                {posts.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 bg-white rounded-[30px] border-2 border-[#ECC8CD]/40 shadow-lg"
                    >
                        <div className="text-5xl mb-4">📝</div>
                        <p className="text-[#3E3229] font-nunito font-bold text-lg">No posts yet</p>
                        <p className="text-[#7A6862] text-sm mt-2">Be the first to share! ✨</p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
