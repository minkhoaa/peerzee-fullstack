import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SocialPost, SocialComment, SocialLike, SocialVote } from './entities';
import { CreatePostDto, CreateCommentDto, GetFeedDto } from './dto';
import { User } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

// Response interfaces
export interface PostWithMeta {
    id: string;
    content: string;
    media: any[];
    tags: string[];
    score: number;
    commentsCount: number;
    createdAt: Date;
    updatedAt: Date;
    author: {
        id: string;
        email: string;
        display_name?: string;
        avatar?: string;
    };
    userVote: number; // 1 (Up), -1 (Down), or 0 (None) - VITAL for UI
}

export interface FeedResponse {
    data: PostWithMeta[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface VoteResult {
    newScore: number;
    userVote: number;
}

@Injectable()
export class CommunityService {
    constructor(
        @InjectRepository(SocialPost)
        private readonly postRepo: EntityRepository<SocialPost>,
        @InjectRepository(SocialComment)
        private readonly commentRepo: EntityRepository<SocialComment>,
        @InjectRepository(SocialLike)
        private readonly likeRepo: EntityRepository<SocialLike>,
        @InjectRepository(SocialVote)
        private readonly voteRepo: EntityRepository<SocialVote>,
        @InjectRepository(User)
        private readonly userRepo: EntityRepository<User>,
        private readonly em: EntityManager,
        @Inject(forwardRef(() => NotificationService))
        private readonly notificationService: NotificationService,
    ) { }

    /**
     * Create a new post
     */
    async createPost(userId: string, dto: CreatePostDto): Promise<SocialPost> {
        const author = await this.userRepo.findOne({ id: userId });
        if (!author) throw new Error('User not found');

        const post = new SocialPost();
        post.content = dto.content;
        post.tags = dto.tags || [];
        post.media = dto.media || [];
        post.author = author;
        post.score = 0;
        post.likesCount = 0;
        post.commentsCount = 0;
        await this.em.persistAndFlush(post);
        return post;
    }

    /**
     * Get feed with cursor-based pagination - Uses RAW SQL for complex queries
     * Returns userVote for each post (1, -1, or 0)
     */
    async getFeed(userId: string, dto: GetFeedDto): Promise<FeedResponse> {
        const limit = dto.limit || 10;
        const sort = dto.sort || 'new';

        // Build filter conditions
        const where: any = {};

        // Filter by tag if provided
        if (dto.tag) {
            where.tags = { $contains: [dto.tag] };
        }

        // Cursor-based pagination
        if (dto.cursor) {
            const cursorPost = await this.postRepo.findOne({ id: dto.cursor });
            if (cursorPost) {
                if (sort === 'top') {
                    where.$or = [
                        { score: { $lt: cursorPost.score } },
                        { score: cursorPost.score, id: { $lt: cursorPost.id } }
                    ];
                } else {
                    where.createdAt = { $lt: cursorPost.createdAt };
                }
            }
        }

        // Order by
        const orderBy: any = sort === 'top'
            ? { score: 'DESC', id: 'DESC' }
            : { createdAt: 'DESC' };

        // Fetch posts with author and profile populated
        const posts = await this.postRepo.find(where, {
            populate: ['author', 'author.profile'],
            orderBy,
            limit: limit + 1,
        });

        // Check for more results
        const hasMore = posts.length > limit;
        if (hasMore) posts.pop();

        // Get user's votes for these posts
        const postIds = posts.map((p) => p.id);
        let userVotesMap = new Map<string, number>();

        if (postIds.length > 0 && userId) {
            const userVotes = await this.voteRepo.find({
                user: { id: userId },
                post: { id: { $in: postIds } }
            });
            userVotes.forEach((v) => userVotesMap.set(v.post.id, v.value));
        }

        // Map to response format
        const data: PostWithMeta[] = posts.map((post) => ({
            id: post.id,
            content: post.content,
            media: post.media,
            tags: post.tags,
            score: post.score,
            commentsCount: post.commentsCount,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: {
                id: post.author.id,
                email: post.author.email,
                display_name: post.author.profile?.display_name || post.author.email.split('@')[0],
                avatar: post.author.profile?.photos?.[0]?.url,
            },
            userVote: userVotesMap.get(post.id) || 0,
        }));

        return {
            data,
            nextCursor: hasMore && posts.length > 0 ? posts[posts.length - 1].id : null,
            hasMore,
        };
    }

    /**
     * Reddit-style voting (Atomic Transaction)
     * value: 1 (Upvote), -1 (Downvote), 0 (Remove vote)
     */
    async vote(userId: string, postId: string, value: number): Promise<VoteResult> {
        // Validate value
        if (![1, -1, 0].includes(value)) {
            throw new Error('Invalid vote value. Must be 1, -1, or 0.');
        }

        return this.em.transactional(async (em) => {
            // Get post
            const post = await em.findOne(SocialPost, { id: postId });
            if (!post) {
                throw new NotFoundException('Post not found');
            }

            // Get existing vote
            const existingVote = await em.findOne(SocialVote, {
                user: { id: userId }, post: { id: postId },
            });

            const oldValue = existingVote?.value || 0;
            const scoreDiff = value - oldValue;

            // Update score
            post.score += scoreDiff;

            // Handle vote record
            if (value === 0) {
                // Remove vote
                if (existingVote) {
                    em.remove(existingVote);
                }
            } else {
                // Update or create vote
                if (existingVote) {
                    existingVote.value = value;
                } else {
                    const newVote = new SocialVote();
                    const user = await this.userRepo.findOne({ id: userId });
                    const post = await this.postRepo.findOne({ id: postId });
                    if (!user || !post) throw new Error('User or Post not found');
                    newVote.user = user;
                    newVote.post = post;
                    newVote.value = value;
                    em.persist(newVote);
                }
            }

            // Flush all changes in transaction
            await em.flush();

            return { newScore: post.score, userVote: value };
        });
    }

    /**
     * Toggle like (legacy support) - maps to voting
     */
    async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
        const existingVote = await this.voteRepo.findOne({
            user: { id: userId }, post: { id: postId },
        });

        const post = await this.postRepo.findOne({ id: postId }, { populate: ['author', 'author.profile'] });
        const liker = await this.userRepo.findOne({ id: userId }, { populate: ['profile'] });

        if (existingVote && existingVote.value === 1) {
            // Unlike - remove upvote
            await this.vote(userId, postId, 0);
            const updatedPost = await this.postRepo.findOne({ id: postId });
            return { liked: false, likesCount: updatedPost?.score || 0 };
        } else {
            // Like - add upvote
            await this.vote(userId, postId, 1);
            const updatedPost = await this.postRepo.findOne({ id: postId });

            // Create notification for post author (if not liking own post)
            if (post && post.author && post.author.id !== userId) {
                const likerName = liker?.profile?.display_name || liker?.email?.split('@')[0] || 'Someone';
                await this.notificationService.createAndEmit(
                    post.author.id,
                    NotificationType.LIKE_POST,
                    'Có người thích bài viết của bạn',
                    `${likerName} đã thích bài viết của bạn`,
                    { postId, userId, userName: likerName },
                );
            }

            return { liked: true, likesCount: updatedPost?.score || 0 };
        }
    }

    /**
     * Add a comment to a post
     */
    async addComment(userId: string, postId: string, dto: CreateCommentDto): Promise<SocialComment> {
        const post = await this.postRepo.findOne({ id: postId });
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const author = await this.userRepo.findOne({ id: userId });
        const postEntity = await this.postRepo.findOne({ id: postId });
        if (!author || !postEntity) throw new Error('User or Post not found');

        const comment = new SocialComment();
        comment.content = dto.content;
        comment.author = author;
        comment.post = postEntity;
        this.em.persist(comment);

        // Update comments count
        post.commentsCount += 1;
        await this.em.flush();

        // Load author relation
        await this.em.populate(comment, ['author', 'author.profile']);
        
        // Load post author for notification
        await this.em.populate(post, ['author']);

        // Create notification for post author (if not commenting on own post)
        if (post.author && post.author.id !== userId) {
            const commenterName = author?.profile?.display_name || author?.email?.split('@')[0] || 'Someone';
            await this.notificationService.createAndEmit(
                post.author.id,
                NotificationType.COMMENT,
                'Có người bình luận bài viết của bạn',
                `${commenterName} đã bình luận: "${dto.content.substring(0, 50)}${dto.content.length > 50 ? '...' : ''}"`,
                { postId, userId, userName: commenterName, commentId: comment.id },
            );
        }

        return comment;
    }

    /**
     * Get comments for a post
     */
    async getComments(postId: string, limit: number = 20, cursor?: string) {
        let whereCondition: any = { post_id: postId };

        if (cursor) {
            const cursorComment = await this.commentRepo.findOne({ id: cursor });
            if (cursorComment) {
                whereCondition = {
                    post_id: postId,
                    createdAt: { $gt: cursorComment.createdAt },
                };
            }
        }

        const comments = await this.commentRepo.find(
            whereCondition,
            {
                populate: ['author', 'author.profile'],
                orderBy: { createdAt: 'ASC' },
                limit: limit + 1,
            }
        );

        const hasMore = comments.length > limit;
        if (hasMore) comments.pop();

        return {
            comments: comments.map((c) => ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                author: {
                    id: c.author?.id,
                    email: c.author?.email || '',
                    display_name:
                        c.author?.profile?.display_name || c.author?.email?.split('@')[0],
                },
            })),
            nextCursor: hasMore && comments.length > 0 ? comments[comments.length - 1].id : null,
            hasMore,
        };
    }

    /**
     * Get a single post by ID
     */
    async getPost(userId: string, postId: string): Promise<PostWithMeta | null> {
        const post = await this.postRepo.findOne(
            { id: postId },
            { populate: ['author', 'author.profile'] }
        );

        if (!post) return null;

        const userVote = await this.voteRepo.findOne({
            user: { id: userId }, post: { id: postId },
        });

        return {
            id: post.id,
            content: post.content,
            media: post.media,
            tags: post.tags,
            score: post.score,
            commentsCount: post.commentsCount,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            author: {
                id: post.author?.id,
                email: post.author?.email || '',
                display_name:
                    post.author?.profile?.display_name ||
                    post.author?.email?.split('@')[0],
            },
            userVote: userVote?.value || 0,
        };
    }

    /**
     * Delete a post (only by author)
     */
    async deletePost(userId: string, postId: string): Promise<void> {
        const post = await this.postRepo.findOne({ id: postId });
        if (!post) throw new NotFoundException('Post not found');
        await this.em.populate(post, ['author']);
        if (post.author?.id !== userId) throw new NotFoundException('Post not found');
        await this.em.removeAndFlush(post);
    }

    /**
     * Get trending tags (last 7 days) - Uses ORM query
     */
    async getTrendingTags(limit: number = 5): Promise<{ tag: string; count: number }[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get recent posts with tags
        const posts = await this.postRepo.find({
            createdAt: { $gte: sevenDaysAgo },
            tags: { $ne: null }
        }, { fields: ['tags'] });

        // Count tag occurrences (filter out empty arrays in memory)
        const tagCount = new Map<string, number>();
        posts.forEach(post => {
            if (post.tags && post.tags.length > 0) {
                post.tags.forEach(tag => {
                    const cleanTag = tag.replace(/^#/, '');
                    tagCount.set(cleanTag, (tagCount.get(cleanTag) || 0) + 1);
                });
            }
        });

        // Sort by count and return top N
        return Array.from(tagCount.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get suggested users - Uses ORM query
     */
    async getSuggestedUsers(userId: string, limit: number = 3) {
        // Note: MikroORM doesn't support RANDOM() in orderBy directly
        // So we fetch more users and shuffle in memory
        const users = await this.userRepo.find(
            { id: { $ne: userId }, status: 'active' },
            { populate: ['profile'], limit: limit * 3 }
        );

        // Shuffle and take limit
        const shuffled = users.sort(() => Math.random() - 0.5).slice(0, limit);

        return shuffled.map((u) => ({
            id: u.id,
            email: u.email,
            display_name: u.profile?.display_name || u.email.split('@')[0],
            bio: u.profile?.bio,
            avatar: u.profile?.photos?.[0]?.url,
        }));
    }

    /**
     * Get topics for left sidebar navigation - Uses ORM query
     */
    async getTopics(): Promise<{ name: string; slug: string; count: number; icon?: string }[]> {
        const pinnedTopics = [
            { name: 'Programming', slug: 'Programming', icon: '💻' },
            { name: 'WebDev', slug: 'WebDev', icon: '🌐' },
            { name: 'Career', slug: 'Career', icon: '💼' },
            { name: 'IELTS', slug: 'IELTS', icon: '📚' },
            { name: 'Interview', slug: 'Interview', icon: '🎯' },
            { name: 'DevLife', slug: 'DevLife', icon: '☕' },
            { name: 'Memes', slug: 'Memes', icon: '😂' },
        ];

        // Get all posts with tags
        const posts = await this.postRepo.find(
            { tags: { $ne: null } },
            { fields: ['tags'] }
        );

        // Count occurrences of pinned topics (filter empty arrays in memory)
        const countMap = new Map<string, number>();
        const pinnedTagsSet = new Set(pinnedTopics.map(t => `#${t.slug}`));

        posts.forEach(post => {
            if (post.tags && post.tags.length > 0) {
                post.tags.forEach(tag => {
                    if (pinnedTagsSet.has(tag)) {
                        const cleanTag = tag.replace(/^#/, '');
                        countMap.set(cleanTag, (countMap.get(cleanTag) || 0) + 1);
                    }
                });
            }
        });

        return pinnedTopics.map(topic => ({
            ...topic,
            count: countMap.get(topic.slug) || 0,
        }));
    }

    /**
     * Seed dummy posts for testing (50 posts)
     */
    async seedPosts(authorId?: string): Promise<{ count: number; comments: number; votes: number }> {
        // Get all active users for varied authorship
        const users = await this.userRepo.find({ status: 'active' }, { limit: 20 });
        if (users.length === 0) {
            throw new Error('No users found to create posts');
        }

        // Sample post templates with varied topics
        const templates = [
            { content: '🚀 Just deployed my first NestJS app to production! The DX is amazing compared to Express.', tags: ['#NestJS', '#Backend', '#WebDev'], comments: ['Congrats!', 'DI system is clean!', 'Try Fastify adapter'] },
            { content: 'Hot take: TypeScript makes JavaScript enjoyable. Fight me. 🔥', tags: ['#TypeScript', '#JavaScript', '#Programming'], comments: ['Type safety is everything!', 'Just facts', 'any any any 😂'] },
            { content: 'Finally got an offer from FAANG after 3 months of LeetCode grinding! AMA! 💪', tags: ['#LeetCode', '#Interview', '#FAANG', '#Career'], comments: ['Which company?', 'How many problems?', 'Inspiring!'] },
            { content: 'React Server Components are changing how I think about data fetching. 🧠', tags: ['#React', '#NextJS', '#WebDev'], comments: ['Hydration errors though...', 'use client everywhere 😅'] },
            { content: 'Just finished reading "Clean Code" again. What tech books changed your career?', tags: ['#Programming', '#Books', '#CleanCode'], comments: ['Pragmatic Programmer!', 'DDIA is a must'] },
            { content: 'My VS Code setup after 5 years of tweaking. Ask me about any extension! 🎨', tags: ['#VSCode', '#DevTools', '#Productivity'], comments: ['What theme?', 'Vim extension?'] },
            { content: 'CSS is not hard. What\'s hard is not having a design system. 🎯', tags: ['#CSS', '#DesignSystem', '#Frontend'], comments: ['Tailwind!', 'Design tokens + variables = 🔥'] },
            { content: 'Vim users: "10 years and still learning!" Me: *figures out how to exit* 😆', tags: ['#Vim', '#Memes', '#DevLife'], comments: [':q! gang 🤣', 'Neovim btw'] },
            { content: 'PostgreSQL JSONB is so powerful. NoSQL-in-SQL is the way! 🐘', tags: ['#PostgreSQL', '#Database', '#Backend'], comments: ['GIN indexes are magic', 'Be careful with large blobs'] },
            { content: 'Learning Rust as a JS dev. Week 4: The compiler is my best friend 🦀', tags: ['#Rust', '#Learning', '#Programming'], comments: ['Borrow checker teaches discipline', 'Wait for lifetimes 😈'] },
            { content: 'Ai còn dùng console.log để debug không? 🙋‍♂️', tags: ['#JavaScript', '#Debugging', '#WebDev'], comments: ['console.log forever!', 'console.table() cho objects'] },
            { content: 'HR: "Anh biết gì về công ty chúng tôi?" - Tôi: "Em biết các anh đang tuyển..." 💀', tags: ['#Interview', '#Memes', '#DevLife'], comments: ['Quá thật 🤣', 'Honest king'] },
            { content: 'Just hit 1000 stars on my first open source project! 🌟', tags: ['#OpenSource', '#GitHub', '#Career'], comments: ['Congrats!', 'Link please?', 'What stack?'] },
            { content: 'Docker Compose vs Kubernetes for small projects? I choose... Docker Compose 🐳', tags: ['#Docker', '#DevOps', '#Backend'], comments: ['K8s overkill for small apps', 'Compose is perfect'] },
            { content: 'Tailwind CSS is the best thing that happened to my productivity 💨', tags: ['#TailwindCSS', '#CSS', '#Frontend'], comments: ['Class soup though', 'Tailwind UI is 🔥'] },
            { content: 'GraphQL or REST? In 2024, I still choose REST for most cases 🤷', tags: ['#GraphQL', '#REST', '#Backend'], comments: ['Over-fetching tho', 'REST is simpler'] },
            { content: 'Prisma vs TypeORM? I switched to Drizzle and never looked back 🚀', tags: ['#ORM', '#Database', '#Backend'], comments: ['Drizzle is fast!', 'Type safety 👌'] },
            { content: 'Just discovered Bun and I\'m amazed! Faster than Node 💨', tags: ['#Bun', '#NodeJS', '#JavaScript'], comments: ['Compatibility?', 'Used it in prod?'] },
            { content: 'IELTS 8.0 sau 3 tháng tự học! Here are my tips... 📚', tags: ['#IELTS', '#Learning', '#English'], comments: ['Share lộ trình!', 'App nào?'] },
            { content: 'From 0 to 100k salary in 2 years. Roadmap inside... 💰', tags: ['#Career', '#Salary', '#WebDev'], comments: ['Inspiring!', 'What technologies?'] },
        ];

        // Generate 50 posts by repeating with variations
        const allPosts: typeof templates = [];
        const variations = ['🔥', '💡', '🎯', '⚡', '✨', '🚀', '💪', '🧠'];

        for (let round = 0; round < 3; round++) {
            for (const template of templates) {
                const variation = variations[Math.floor(Math.random() * variations.length)];
                allPosts.push({
                    content: round === 0 ? template.content : `${variation} ${template.content}`,
                    tags: template.tags,
                    comments: template.comments,
                });
                if (allPosts.length >= 50) break;
            }
            if (allPosts.length >= 50) break;
        }

        let totalComments = 0;
        let totalVotes = 0;
        const savedPosts: SocialPost[] = [];

        for (let i = 0; i < allPosts.length; i++) {
            const postData = allPosts[i];
            const author = users[i % users.length];

            // Create post with varied timestamps (last 7 days)
            const hoursAgo = Math.floor(Math.random() * 168); // Up to 7 days
            const post = new SocialPost();
            post.content = postData.content;
            post.tags = postData.tags;
            post.media = [];
            post.author = author;
            post.score = 0;
            post.likesCount = 0;
            post.commentsCount = 0;
            post.createdAt = new Date(Date.now() - hoursAgo * 3600000);
            this.em.persist(post);
            savedPosts.push(post);

            // Create comments from random users (50% chance for each comment)
            for (const commentContent of postData.comments || []) {
                if (Math.random() > 0.5) continue;
                const commenter = users[Math.floor(Math.random() * users.length)];
                const comment = new SocialComment();
                comment.content = commentContent;
                comment.author = commenter;
                comment.post = post;
                comment.createdAt = new Date(post.createdAt.getTime() + Math.random() * 3600000 * 5);
                this.em.persist(comment);
                totalComments++;
                post.commentsCount++;
            }

            // Create votes from random users (varied voter count)
            const votersCount = Math.floor(Math.random() * Math.min(users.length, 15)) + 1;
            let score = 0;
            for (let j = 0; j < votersCount; j++) {
                const voter = users[Math.floor(Math.random() * users.length)];
                if (voter.id === author.id) continue;

                const voteValue = Math.random() > 0.25 ? 1 : -1; // 75% upvotes
                try {
                    const vote = new SocialVote();
                    vote.user = voter;
                    vote.post = post;
                    vote.value = voteValue;
                    this.em.persist(vote);
                    score += voteValue;
                    totalVotes++;
                } catch {
                    // Skip duplicate votes
                }
            }

            post.score = score;
        }

        // Flush all at once
        await this.em.flush();

        return { count: savedPosts.length, comments: totalComments, votes: totalVotes };
    }

    /**
     * Clear all community data (for clean reset)
     */
    async clearAllData(): Promise<{ deleted: boolean }> {
        await this.voteRepo.nativeDelete({});
        await this.commentRepo.nativeDelete({});
        await this.postRepo.nativeDelete({});
        return { deleted: true };
    }
}
