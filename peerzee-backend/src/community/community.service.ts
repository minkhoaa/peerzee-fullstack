import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan, DataSource } from 'typeorm';
import { SocialPost, SocialComment, SocialLike, SocialVote } from './entities';
import { CreatePostDto, CreateCommentDto, GetFeedDto } from './dto';
import { User } from '../user/entities/user.entity';

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
        private readonly postRepo: Repository<SocialPost>,
        @InjectRepository(SocialComment)
        private readonly commentRepo: Repository<SocialComment>,
        @InjectRepository(SocialLike)
        private readonly likeRepo: Repository<SocialLike>,
        @InjectRepository(SocialVote)
        private readonly voteRepo: Repository<SocialVote>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Create a new post
     */
    async createPost(userId: string, dto: CreatePostDto): Promise<SocialPost> {
        const post = this.postRepo.create({
            content: dto.content,
            tags: dto.tags || [],
            media: dto.media || [],
            author_id: userId,
            score: 0,
        });
        return this.postRepo.save(post);
    }

    /**
     * Get feed with cursor-based pagination
     * Returns userVote for each post (1, -1, or 0)
     */
    async getFeed(userId: string, dto: GetFeedDto): Promise<FeedResponse> {
        const limit = dto.limit || 10;
        const sort = dto.sort || 'new';

        // Build query
        const queryBuilder = this.postRepo
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('author.profile', 'profile');

        // Filter by tag if provided
        if (dto.tag) {
            queryBuilder.andWhere(`post.tags @> :tag::jsonb`, {
                tag: JSON.stringify([dto.tag]),
            });
        }

        // Cursor-based pagination (different for each sort mode)
        if (dto.cursor) {
            const cursorPost = await this.postRepo.findOne({
                where: { id: dto.cursor },
                select: ['createdAt', 'score', 'id'],
            });
            if (cursorPost) {
                if (sort === 'top') {
                    // For "top" sort: get posts with lower score, or same score but older
                    queryBuilder.andWhere(
                        '(post.score < :score OR (post.score = :score AND post.id < :id))',
                        { score: cursorPost.score, id: cursorPost.id }
                    );
                } else {
                    // For "new" sort: get older posts
                    queryBuilder.andWhere('post.createdAt < :createdAt', {
                        createdAt: cursorPost.createdAt,
                    });
                }
            }
        }

        // Order based on sort mode
        if (sort === 'top') {
            queryBuilder.orderBy('post.score', 'DESC').addOrderBy('post.id', 'DESC');
        } else {
            queryBuilder.orderBy('post.createdAt', 'DESC');
        }

        queryBuilder.take(limit + 1);

        const posts = await queryBuilder.getMany();

        // Check for more results
        const hasMore = posts.length > limit;
        if (hasMore) posts.pop();

        // Get user's votes for these posts
        const postIds = posts.map((p) => p.id);
        let userVotesMap = new Map<string, number>();

        if (postIds.length > 0 && userId) {
            const userVotes = await this.voteRepo.find({
                where: { user_id: userId, post_id: In(postIds) },
                select: ['post_id', 'value'],
            });
            userVotes.forEach((v) => userVotesMap.set(v.post_id, v.value));
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
                id: post.author?.id || post.author_id,
                email: post.author?.email || '',
                display_name:
                    post.author?.profile?.display_name ||
                    post.author?.email?.split('@')[0],
                avatar: post.author?.profile?.photos?.[0]?.url,
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

        return this.dataSource.transaction(async (manager) => {
            const postRepo = manager.getRepository(SocialPost);
            const voteRepo = manager.getRepository(SocialVote);

            // Get post
            const post = await postRepo.findOne({ where: { id: postId } });
            if (!post) {
                throw new NotFoundException('Post not found');
            }

            // Get existing vote
            const existingVote = await voteRepo.findOne({
                where: { user_id: userId, post_id: postId },
            });

            const oldValue = existingVote?.value || 0;
            const scoreDiff = value - oldValue;

            // Update score
            post.score += scoreDiff;

            // Handle vote record
            if (value === 0) {
                // Remove vote
                if (existingVote) {
                    await voteRepo.remove(existingVote);
                }
            } else {
                // Update or create vote
                if (existingVote) {
                    existingVote.value = value;
                    await voteRepo.save(existingVote);
                } else {
                    const newVote = voteRepo.create({
                        user_id: userId,
                        post_id: postId,
                        value,
                    });
                    await voteRepo.save(newVote);
                }
            }

            // Save post with new score
            await postRepo.save(post);

            return { newScore: post.score, userVote: value };
        });
    }

    /**
     * Toggle like (legacy support) - maps to voting
     */
    async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
        const existingVote = await this.voteRepo.findOne({
            where: { user_id: userId, post_id: postId },
        });

        if (existingVote && existingVote.value === 1) {
            // Unlike - remove upvote
            await this.vote(userId, postId, 0);
            const post = await this.postRepo.findOne({ where: { id: postId } });
            return { liked: false, likesCount: post?.score || 0 };
        } else {
            // Like - add upvote
            await this.vote(userId, postId, 1);
            const post = await this.postRepo.findOne({ where: { id: postId } });
            return { liked: true, likesCount: post?.score || 0 };
        }
    }

    /**
     * Add a comment to a post
     */
    async addComment(userId: string, postId: string, dto: CreateCommentDto): Promise<SocialComment> {
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const comment = this.commentRepo.create({
            content: dto.content,
            author_id: userId,
            post_id: postId,
        });
        const savedComment = await this.commentRepo.save(comment);

        // Update comments count
        post.commentsCount += 1;
        await this.postRepo.save(post);

        // Load author relation
        const loadedComment = await this.commentRepo.findOne({
            where: { id: savedComment.id },
            relations: ['author', 'author.profile'],
        });

        return loadedComment || savedComment;
    }

    /**
     * Get comments for a post
     */
    async getComments(postId: string, limit: number = 20, cursor?: string) {
        let whereCondition: any = { post_id: postId };

        if (cursor) {
            const cursorComment = await this.commentRepo.findOne({
                where: { id: cursor },
                select: ['createdAt'],
            });
            if (cursorComment) {
                whereCondition = {
                    post_id: postId,
                    createdAt: MoreThan(cursorComment.createdAt),
                };
            }
        }

        const comments = await this.commentRepo.find({
            where: whereCondition,
            relations: ['author', 'author.profile'],
            order: { createdAt: 'ASC' },
            take: limit + 1,
        });

        const hasMore = comments.length > limit;
        if (hasMore) comments.pop();

        return {
            comments: comments.map((c) => ({
                id: c.id,
                content: c.content,
                createdAt: c.createdAt,
                author: {
                    id: c.author?.id || c.author_id,
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
        const post = await this.postRepo.findOne({
            where: { id: postId },
            relations: ['author', 'author.profile'],
        });

        if (!post) return null;

        const userVote = await this.voteRepo.findOne({
            where: { user_id: userId, post_id: postId },
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
                id: post.author?.id || post.author_id,
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
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.author_id !== userId) throw new NotFoundException('Post not found');
        await this.postRepo.remove(post);
    }

    /**
     * Get trending tags (last 7 days)
     */
    async getTrendingTags(limit: number = 5): Promise<{ tag: string; count: number }[]> {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const result = await this.postRepo.query(
            `
            SELECT tag, COUNT(*) as count
            FROM (
                SELECT jsonb_array_elements_text(tags) as tag
                FROM social_posts
                WHERE tags IS NOT NULL 
                AND jsonb_array_length(tags) > 0
                AND created_at > $1
            ) subquery
            GROUP BY tag
            ORDER BY count DESC
            LIMIT $2
        `,
            [sevenDaysAgo.toISOString(), limit],
        );

        return result.map((row: any) => ({
            tag: row.tag.replace(/^#/, ''),
            count: parseInt(row.count, 10),
        }));
    }

    /**
     * Get suggested users (random users not yet followed)
     */
    async getSuggestedUsers(userId: string, limit: number = 3) {
        // Simple implementation: random active users
        const users = await this.userRepo
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .where('user.id != :userId', { userId })
            .andWhere('user.status = :status', { status: 'active' })
            .orderBy('RANDOM()')
            .limit(limit)
            .getMany();

        return users.map((u) => ({
            id: u.id,
            email: u.email,
            display_name: u.profile?.display_name || u.email.split('@')[0],
            bio: u.profile?.bio,
            avatar: u.profile?.photos?.[0]?.url,
        }));
    }

    /**
     * Get topics for left sidebar navigation
     * Returns pinned/popular topics with post counts
     */
    async getTopics(): Promise<{ name: string; slug: string; count: number; icon?: string }[]> {
        // Popular topics with icons
        const pinnedTopics = [
            { name: 'Programming', slug: 'Programming', icon: '💻' },
            { name: 'WebDev', slug: 'WebDev', icon: '🌐' },
            { name: 'Career', slug: 'Career', icon: '💼' },
            { name: 'IELTS', slug: 'IELTS', icon: '📚' },
            { name: 'Interview', slug: 'Interview', icon: '🎯' },
            { name: 'DevLife', slug: 'DevLife', icon: '☕' },
            { name: 'Memes', slug: 'Memes', icon: '😂' },
        ];

        // Get counts for each topic
        const result = await this.postRepo.query(`
            SELECT tag, COUNT(*) as count
            FROM (
                SELECT jsonb_array_elements_text(tags) as tag
                FROM social_posts
                WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
            ) subquery
            WHERE tag = ANY($1::text[])
            GROUP BY tag
        `, [pinnedTopics.map(t => `#${t.slug}`)]);

        const countMap = new Map<string, number>();
        result.forEach((row: any) => {
            const cleanTag = row.tag.replace(/^#/, '');
            countMap.set(cleanTag, parseInt(row.count, 10));
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
        const users = await this.userRepo.find({ where: { status: 'active' }, take: 20 });
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
            const post = this.postRepo.create({
                content: postData.content,
                tags: postData.tags,
                media: [],
                author_id: author.id,
                score: 0,
                commentsCount: 0,
                createdAt: new Date(Date.now() - hoursAgo * 3600000),
            });
            const savedPost = await this.postRepo.save(post);
            savedPosts.push(savedPost);

            // Create comments from random users (50% chance for each comment)
            for (const commentContent of postData.comments || []) {
                if (Math.random() > 0.5) continue;
                const commenter = users[Math.floor(Math.random() * users.length)];
                await this.commentRepo.save({
                    content: commentContent,
                    author_id: commenter.id,
                    post_id: savedPost.id,
                    createdAt: new Date(savedPost.createdAt.getTime() + Math.random() * 3600000 * 5),
                });
                totalComments++;
                savedPost.commentsCount++;
            }

            // Create votes from random users (varied voter count)
            const votersCount = Math.floor(Math.random() * Math.min(users.length, 15)) + 1;
            let score = 0;
            for (let j = 0; j < votersCount; j++) {
                const voter = users[Math.floor(Math.random() * users.length)];
                if (voter.id === author.id) continue;

                const voteValue = Math.random() > 0.25 ? 1 : -1; // 75% upvotes
                try {
                    await this.voteRepo.save({
                        user_id: voter.id,
                        post_id: savedPost.id,
                        value: voteValue,
                    });
                    score += voteValue;
                    totalVotes++;
                } catch {
                    // Skip duplicate votes
                }
            }

            savedPost.score = score;
            await this.postRepo.save(savedPost);
        }

        return { count: savedPosts.length, comments: totalComments, votes: totalVotes };
    }

    /**
     * Clear all community data (for clean reset)
     */
    async clearAllData(): Promise<{ deleted: boolean }> {
        await this.voteRepo.delete({});
        await this.commentRepo.delete({});
        await this.postRepo.delete({});
        return { deleted: true };
    }
}
