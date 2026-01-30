'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw } from 'lucide-react';
import type { Post, User as UserType, TrendingTopic } from '@/types/community';
import { NoteCard, WriteNote, TownCrier, VillageNav } from '@/components/community';
import { GlobalHeader } from '@/components/layout';
import { communityApi, SocialPost, TrendingTag, SuggestedUser } from '@/lib/communityApi';

// ============================================
// FRESH SAGE & COOL TAUPE PALETTE
// ============================================
const COLORS = {
  // Backgrounds
  bgSage: '#E8F3E8',           // Fresh Pale Sage Green (App Background)
  paper: '#F9F7F1',            // Warm off-white for paper notes
  white: '#FFFFFF',            // High contrast white
  // Cool Taupe tones
  taupe: '#62544B',            // Cool Taupe (Borders & Main Text)
  taupeMuted: '#8E8279',       // Lighter Taupe (Secondary)
  // Board frame
  boardFrame: '#7A6B5E',       // Cool frame color
  boardFrameDark: '#5C4F44',   // Darker frame border
  // Accents
  pink: '#F4AAB9',
} as const;

// Pin colors for variety
const PIN_COLORS: Array<'pink' | 'red' | 'blue' | 'yellow' | 'green'> = ['red', 'blue', 'yellow', 'green', 'pink'];

// Helper: Convert API post to UI Post format
const convertToUIPost = (apiPost: SocialPost): Post => ({
  id: apiPost.id,
  content: apiPost.content,
  imageUrls: apiPost.media?.filter(m => m.type === 'image').map(m => m.url),
  author: {
    id: apiPost.author.id,
    username: apiPost.author.display_name || apiPost.author.email.split('@')[0],
    avatarUrl: apiPost.author.avatar || '',
    level: 1,
  },
  createdAt: apiPost.createdAt,
  stats: {
    likes: apiPost.likesCount || apiPost.score || 0,
    comments: apiPost.commentsCount || 0,
    shares: 0,
  },
  tags: apiPost.tags || [],
  isLiked: apiPost.isLiked || apiPost.userVote === 1,
});

// Fallback mock data when API fails
const MOCK_USERS: UserType[] = [
  { id: '101', username: 'Mayor\'s Office', avatarUrl: 'https://i.pravatar.cc/150?img=1', level: 99, isOnline: true },
  { id: '102', username: 'Farmer_Joe', avatarUrl: 'https://i.pravatar.cc/150?img=12', level: 8, isOnline: false },
  { id: '103', username: 'Merlin_Official', avatarUrl: 'https://i.pravatar.cc/150?img=5', level: 15, isOnline: true },
  { id: '104', username: 'BlacksmithKev', avatarUrl: 'https://i.pravatar.cc/150?img=8', level: 20, isOnline: false },
  { id: '105', username: 'BakerAnna', avatarUrl: 'https://i.pravatar.cc/150?img=20', level: 6, isOnline: true },
  { id: '106', username: 'HerbalistMia', avatarUrl: 'https://i.pravatar.cc/150?img=15', level: 18, isOnline: true },
  { id: '107', username: 'TavernKeeper', avatarUrl: 'https://i.pravatar.cc/150?img=22', level: 12, isOnline: false },
  { id: '108', username: 'WanderingBard', avatarUrl: 'https://i.pravatar.cc/150?img=25', level: 9, isOnline: true },
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    content: 'Don\'t forget to bring your biggest pumpkins to the town square this Friday at sundown. The contest begins promptly at 6 PM!',
    imageUrls: ['https://images.unsplash.com/photo-1509622905150-fa66d3906e09?w=600&q=80'],
    author: { ...MOCK_USERS[0], username: 'Mayor\'s Office' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stats: { likes: 124, comments: 42, shares: 15 },
    tags: ['HarvestFestival', 'Official'],
    isLiked: false,
  },
  {
    id: '2',
    content: 'Anyone have spare wood? I\'m trying to upgrade my barn before winter hits. Will trade for fresh eggs!',
    author: MOCK_USERS[1],
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    stats: { likes: 8, comments: 2, shares: 0 },
    tags: ['Trading', 'Help'],
    isLiked: true,
  },
  {
    id: '3',
    content: 'Found this strange glowing rock near the mystic cave. Does anyone know what it is?',
    imageUrls: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80'],
    author: MOCK_USERS[2],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    stats: { likes: 45, comments: 12, shares: 3 },
    tags: ['Mystery', 'Discovery'],
    isLiked: false,
  },
  {
    id: '4',
    content: 'New batch of healing potions ready! Come by the shop before they sell out. 10% discount for guild members!',
    author: MOCK_USERS[5],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    stats: { likes: 67, comments: 18, shares: 5 },
    tags: ['Shop', 'Potions'],
    isLiked: true,
  },
  {
    id: '5',
    content: 'The traveling merchant caravan arrives tomorrow at dawn! I heard they\'re bringing exotic goods from the Eastern Kingdoms.',
    author: MOCK_USERS[6],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    stats: { likes: 89, comments: 31, shares: 12 },
    tags: ['Event', 'Merchant'],
    isLiked: false,
  },
];

const MOCK_TRENDING: TrendingTopic[] = [
  { id: '1', tag: '#HarvestFestival', postCount: 1200 },
  { id: '2', tag: '#LostCat', postCount: 866 },
  { id: '3', tag: '#PotionRecipes', postCount: 422 },
  { id: '4', tag: '#GuildNews', postCount: 315 },
  { id: '5', tag: '#TownHall', postCount: 198 },
];

// ============================================
// MAIN COMMUNITY PAGE - VILLAGE THEME
// ============================================
export default function CommunityPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>(MOCK_TRENDING);
  const [suggestedUsers, setSuggestedUsers] = useState<UserType[]>(MOCK_USERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Today's date in village format
  const today = new Date();
  const villageDate = `Harvest ${today.getDate()}`;

  // Fetch posts from API
  const fetchPosts = useCallback(async (cursor?: string | null) => {
    try {
      const response = await communityApi.fetchPosts(cursor, 10);
      const apiPosts = response.data || response.posts || [];
      const uiPosts = apiPosts.map(convertToUIPost);

      if (cursor) {
        setPosts(prev => [...prev, ...uiPosts]);
      } else {
        setPosts(uiPosts.length > 0 ? uiPosts : MOCK_POSTS);
      }

      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      // Fallback to mock data on error
      if (!cursor) {
        setPosts(MOCK_POSTS);
      }
      setError('Không thể tải bài viết. Đang hiển thị dữ liệu mẫu.');
    }
  }, []);

  // Fetch trending tags from API
  const fetchTrending = useCallback(async () => {
    try {
      const response = await communityApi.getTrendingTags(5);
      if (response.ok && response.tags) {
        setTrendingTopics(response.tags.map((t, i) => ({
          id: String(i + 1),
          tag: `#${t.tag}`,
          postCount: t.count,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch trending:', err);
      // Keep mock data on error
    }
  }, []);

  // Fetch suggested users from API
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const response = await communityApi.getSuggestedUsers(8);
      if (response.ok && response.users) {
        setSuggestedUsers(response.users.map(u => ({
          id: u.id,
          username: u.display_name || u.email.split('@')[0],
          avatarUrl: '',
          level: 1,
          isOnline: false,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch suggested users:', err);
      // Keep mock data on error
    }
  }, []);

  // Auth check and initial data load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token) {
      setIsLoggedIn(true);
      setCurrentUserId(userId);
    } else {
      setIsLoggedIn(false);
      setCurrentUserId('guest');
    }

    // Fetch all data
    Promise.all([
      fetchPosts(),
      fetchTrending(),
      fetchSuggestedUsers(),
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [fetchPosts, fetchTrending, fetchSuggestedUsers]);

  // Handle post creation with real API
  const handleCreatePost = async (payload: { content: string; imageUrls?: string[]; tags?: string[] }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // If there are images (base64), we need to upload them first
      let mediaItems: { url: string; type: 'image' | 'video' }[] = [];

      if (payload.imageUrls && payload.imageUrls.length > 0) {
        // Convert base64 to files for upload
        const files: File[] = [];
        for (const dataUrl of payload.imageUrls) {
          if (dataUrl.startsWith('data:')) {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            files.push(file);
          }
        }

        if (files.length > 0) {
          const uploadResponse = await communityApi.uploadMedia(files);
          if (uploadResponse.ok && uploadResponse.media) {
            mediaItems = uploadResponse.media;
          }
        }
      }

      // Create the post
      const response = await communityApi.createPost({
        content: payload.content,
        tags: payload.tags,
        media: mediaItems.length > 0 ? mediaItems : undefined,
      });

      if (response.ok && response.post) {
        // Add the new post to the top of the list
        const newPost = convertToUIPost(response.post);
        setPosts(prev => [newPost, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Không thể đăng bài. Vui lòng thử lại.');

      // Fallback: Add locally if API fails (for demo)
      const newPost: Post = {
        id: `local-${Date.now()}`,
        content: payload.content,
        imageUrls: payload.imageUrls,
        author: {
          id: currentUserId || 'guest',
          username: 'You',
          avatarUrl: '',
          level: 1,
        },
        createdAt: new Date().toISOString(),
        stats: { likes: 0, comments: 0, shares: 0 },
        tags: payload.tags || [],
      };
      setPosts(prev => [newPost, ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like with real API
  const handleLike = async (postId: string) => {
    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = !post.isLiked;
        return {
          ...post,
          isLiked,
          stats: {
            ...post.stats,
            likes: isLiked ? post.stats.likes + 1 : post.stats.likes - 1
          }
        };
      }
      return post;
    }));

    // Call API
    try {
      await communityApi.toggleLike(postId);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert on error
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            stats: {
              ...post.stats,
              likes: isLiked ? post.stats.likes + 1 : post.stats.likes - 1
            }
          };
        }
        return post;
      }));
    }
  };

  // Handle delete with real API
  const handleDelete = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);

    // Optimistic update
    setPosts(prev => prev.filter(post => post.id !== postId));

    // Call API
    try {
      await communityApi.deletePost(postId);
    } catch (err) {
      console.error('Failed to delete post:', err);
      // Revert on error
      if (postToDelete) {
        setPosts(prev => [postToDelete, ...prev]);
      }
    }
  };

  // Handle comment with real API
  const handleComment = async (postId: string, content: string) => {
    try {
      await communityApi.addComment(postId, content);
      // Update comment count
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            stats: {
              ...post.stats,
              comments: post.stats.comments + 1
            }
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  // Refresh posts
  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchPosts();
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-retro-bg pt-16">
      {/* ========== GLOBAL HEADER ========== */}
      <GlobalHeader
        title="QUEST BOARD"
        subtitle="Town Square • Community"
        action={
          <div className="hidden md:flex">
            <div className="flex items-center gap-2 px-3 py-1.5 border-3 border-cocoa bg-retro-paper shadow-pixel-sm">
              <Search className="w-4 h-4 text-cocoa" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm w-40 placeholder:text-cocoa-light text-cocoa font-body"
              />
            </div>
          </div>
        }
      />

      {/* ========== MAIN LAYOUT ========== */}
      <div className="max-w-7xl mx-auto flex gap-4 p-4">
        {/* ===== LEFT SIDEBAR ===== */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <VillageNav activeRoute="/community" mailCount={3} />
          </div>
        </aside>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-1 max-w-2xl">
          {/* Bulletin Board Frame */}
          <div
            className="border-8 p-1 rounded-xl"
            style={{
              backgroundColor: COLORS.boardFrame,
              borderColor: COLORS.boardFrameDark,
              boxShadow: '6px 6px 0 #62544B',
            }}
          >
            {/* Cork Board Inner - Paper background */}
            <div
              className="p-4 min-h-[600px] rounded-lg"
              style={{
                backgroundColor: COLORS.paper,
                backgroundImage: `
                  radial-gradient(ellipse, rgba(0,0,0,0.02) 0%, transparent 70%)
                `,
              }}
            >
              {/* Board Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="font-pixel text-2xl text-cocoa font-bold">
                      Town Square
                    </h2>
                    <p className="font-pixel text-xl text-cocoa-light">
                      Notices
                    </p>
                  </div>
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 border-2 border-cocoa bg-retro-white rounded shadow-pixel-sm hover:bg-pixel-blue disabled:opacity-50 transition-all active:translate-y-0.5 active:shadow-none"
                    title="Refresh posts"
                  >
                    <RefreshCw className={`w-4 h-4 text-cocoa ${isLoading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                  </button>
                </div>
                {/* Date Card */}
                <div className="border-3 px-4 py-2 text-center border-cocoa bg-retro-white shadow-pixel-sm rounded-sm">
                  <p className="text-xs font-medium font-body text-cocoa-light">
                    Today&apos;s Date:
                  </p>
                  <p className="font-pixel text-lg text-cocoa font-bold">
                    {villageDate}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-pixel-yellow/30 border-2 border-cocoa rounded text-sm text-cocoa font-body font-bold flex items-center gap-2">
                  <span>Error:</span> {error}
                </div>
              )}

              {/* Write a Note */}
              <div className="mb-6">
                <WriteNote
                  onSubmit={handleCreatePost}
                  isSubmitting={isSubmitting}
                />
              </div>

              {/* Posts Grid - Masonry-like layout */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="text-4xl mb-3 animate-bounce"></div>
                    <p className="font-pixel text-sm text-cocoa font-bold">
                      Loading notices...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post, index) => (
                    <NoteCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUserId || undefined}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onComment={handleComment}
                      pinColor={PIN_COLORS[index % PIN_COLORS.length]}
                    />
                  ))}
                </div>
              )}

              {/* Promo Card */}
              <div className="mt-6">
                <div className="border-3 border-cocoa p-4 relative overflow-hidden bg-pixel-blue/30 shadow-pixel">
                  {/* NEW badge */}
                  <div className="absolute -top-1 -right-1 px-3 py-1 font-pixel text-xs bg-pixel-pink text-cocoa border-2 border-cocoa">
                    NEW!
                  </div>
                  <div className="text-center">
                    <span className="text-3xl">Store</span>
                    <h3 className="font-pixel text-lg mt-2 text-cocoa">
                      GENERAL STORE SALE
                    </h3>
                    <p className="text-sm font-body text-cocoa-light">
                      50% OFF ALL SEEDS
                    </p>
                    <button className="mt-3 px-6 py-2 font-pixel text-sm uppercase border-3 border-cocoa bg-pixel-pink text-cocoa shadow-pixel hover:-translate-y-0.5 transition-transform">
                      VISIT SHOP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ===== RIGHT SIDEBAR ===== */}
        <aside className="hidden xl:block w-64 flex-shrink-0">
          <div className="sticky top-20">
            <TownCrier
              trendingTopics={trendingTopics}
              newVillagers={suggestedUsers}
              onTopicClick={(tag) => setSearchQuery(tag)}
              onVillagerClick={(id) => router.push(`/profile/${id}`)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
