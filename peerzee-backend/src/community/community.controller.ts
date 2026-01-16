import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    NotFoundException,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFiles,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../user/guards/auth.guard';
import { CommunityService } from './community.service';
import { UploadService } from './upload.service';
import { CreatePostDto, CreateCommentDto, GetFeedDto, VoteDto } from './dto';

@ApiTags('Community')
@Controller('community')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CommunityController {
    constructor(
        private readonly communityService: CommunityService,
        private readonly uploadService: UploadService,
    ) { }

    /**
     * Upload media files (images/videos)
     */
    @Post('upload')
    @ApiOperation({ summary: 'Upload media files' })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FilesInterceptor('files', 10, {
            limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
        }),
    )
    async uploadMedia(@UploadedFiles() files: Express.Multer.File[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const uploadedFiles = await this.uploadService.saveFiles(files);
        return {
            ok: true,
            media: uploadedFiles,
        };
    }

    /**
     * Create a new post
     */
    @Post('posts')
    @ApiOperation({ summary: 'Create a new post' })
    async createPost(@Req() req: Request, @Body() dto: CreatePostDto) {
        const userId = req['user'].user_id;
        const post = await this.communityService.createPost(userId, dto);

        // Load author info
        const fullPost = await this.communityService.getPost(userId, post.id);

        return {
            ok: true,
            post: fullPost,
        };
    }

    /**
     * Get feed with cursor-based pagination
     */
    @Get('posts')
    @ApiOperation({ summary: 'Get community feed with cursor-based pagination' })
    async getFeed(@Req() req: Request, @Query() dto: GetFeedDto) {
        const userId = req['user'].user_id;
        const result = await this.communityService.getFeed(userId, dto);
        return {
            ok: true,
            ...result,
        };
    }

    /**
     * Get a single post
     */
    @Get('posts/:id')
    @ApiOperation({ summary: 'Get a single post by ID' })
    async getPost(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
        const userId = req['user'].user_id;
        const post = await this.communityService.getPost(userId, id);
        if (!post) {
            throw new NotFoundException('Post not found');
        }
        return { ok: true, post };
    }

    /**
     * Delete a post (only author can delete)
     */
    @Delete('posts/:id')
    @ApiOperation({ summary: 'Delete a post' })
    async deletePost(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
        const userId = req['user'].user_id;
        await this.communityService.deletePost(userId, id);
        return { ok: true };
    }

    /**
     * Reddit-style voting (Upvote, Downvote, Unvote)
     */
    @Post('posts/:id/vote')
    @ApiOperation({ summary: 'Vote on a post (1=Upvote, -1=Downvote, 0=Unvote)' })
    async vote(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: VoteDto,
    ) {
        const userId = req['user'].user_id;

        // Validate vote value
        if (![1, -1, 0].includes(dto.value)) {
            throw new BadRequestException('Vote value must be 1, -1, or 0');
        }

        const result = await this.communityService.vote(userId, id, dto.value);
        return {
            ok: true,
            ...result,
        };
    }

    /**
     * Toggle like on a post (legacy support - maps to voting)
     */
    @Post('posts/:id/like')
    @ApiOperation({ summary: 'Toggle like on a post (legacy - use /vote instead)' })
    async toggleLike(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
        const userId = req['user'].user_id;
        const result = await this.communityService.toggleLike(userId, id);
        return {
            ok: true,
            ...result,
        };
    }

    /**
     * Add a comment to a post
     */
    @Post('posts/:id/comments')
    @ApiOperation({ summary: 'Add a comment to a post' })
    async addComment(
        @Req() req: Request,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CreateCommentDto,
    ) {
        const userId = req['user'].user_id;
        const comment = await this.communityService.addComment(userId, id, dto);
        return {
            ok: true,
            comment: {
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                author: {
                    id: comment.author?.id || comment.author_id,
                    email: comment.author?.email || '',
                    display_name:
                        comment.author?.profile?.display_name ||
                        comment.author?.email?.split('@')[0],
                },
            },
        };
    }

    /**
     * Get comments for a post
     */
    @Get('posts/:id/comments')
    @ApiOperation({ summary: 'Get comments for a post' })
    async getComments(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
    ) {
        const result = await this.communityService.getComments(id, limit || 20, cursor);
        return {
            ok: true,
            ...result,
        };
    }

    /**
     * Get trending tags (last 7 days)
     */
    @Get('trending-tags')
    @ApiOperation({ summary: 'Get trending tags from last 7 days' })
    async getTrendingTags(@Query('limit') limit?: number) {
        const tags = await this.communityService.getTrendingTags(limit || 5);
        return {
            ok: true,
            tags,
        };
    }

    /**
     * Legacy endpoint for trending tags
     */
    @Get('tags/trending')
    @ApiOperation({ summary: 'Get trending tags (legacy)' })
    async getTrendingTagsLegacy(@Query('limit') limit?: number) {
        return this.getTrendingTags(limit);
    }

    /**
     * Get suggested users for sidebar
     */
    @Get('suggested-users')
    @ApiOperation({ summary: 'Get suggested users to follow' })
    async getSuggestedUsers(@Req() req: Request, @Query('limit') limit?: number) {
        const userId = req['user'].user_id;
        const users = await this.communityService.getSuggestedUsers(userId, limit || 3);
        return {
            ok: true,
            users,
        };
    }

    /**
     * Get topics for left sidebar navigation
     */
    @Get('topics')
    @ApiOperation({ summary: 'Get popular topics with post counts' })
    async getTopics() {
        const topics = await this.communityService.getTopics();
        return {
            ok: true,
            topics,
        };
    }

    /**
     * Clear all community data (for clean reset)
     */
    @Post('clear')
    @ApiOperation({ summary: 'Clear all community data (posts, comments, votes)' })
    async clearData() {
        await this.communityService.clearAllData();
        return {
            ok: true,
            message: 'All community data cleared',
        };
    }

    /**
     * Seed full realistic data for testing
     */
    @Post('seed')
    @ApiOperation({ summary: 'Seed posts with real comments and votes' })
    async seedPosts(@Req() req: Request) {
        const userId = req['user'].user_id;
        const result = await this.communityService.seedPosts(userId);
        return {
            ok: true,
            message: `Seeded ${result.count} posts, ${result.comments} comments, ${result.votes} votes`,
            ...result,
        };
    }
}
