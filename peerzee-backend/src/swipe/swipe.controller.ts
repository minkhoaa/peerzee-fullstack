import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Logger,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiBody,
} from '@nestjs/swagger';
import { SwipeService } from './swipe.service';
import { CreateSwipeDto, SwipeResponseDto, RecommendationUserDto } from './dto';
import { AuthGuard } from '../user/guards/auth.guard';

@ApiTags('Swipe')
@Controller('swipe')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class SwipeController {
    private readonly logger = new Logger(SwipeController.name);

    constructor(private readonly swipeService: SwipeService) { }

    @Get('recommendations')
    @ApiOperation({ summary: 'Get users to swipe on with rich profile data' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({
        status: 200,
        description: 'List of recommended users with photos, prompts, tags',
        type: [RecommendationUserDto],
    })
    async getRecommendations(
        @Request() req,
        @Query('limit') limit?: number,
    ): Promise<RecommendationUserDto[]> {
        try {
            const result = await this.swipeService.getRecommendations(
                req.user.user_id,
                limit ? parseInt(String(limit), 10) : 10,
            );
            this.logger.log(`Returning ${result.length} recommendations for user ${req.user.user_id}`);
            return result;
        } catch (error) {
            this.logger.error(`Recommendations error: ${error.message}`, error.stack);
            throw new HttpException(
                `Failed to get recommendations: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post()
    @ApiOperation({ summary: 'Swipe on a user (LIKE, PASS, or SUPER_LIKE) with optional message' })
    @ApiResponse({
        status: 201,
        description: 'Swipe recorded, returns match info if applicable',
        type: SwipeResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid swipe action' })
    @ApiResponse({ status: 404, description: 'Target user not found' })
    @ApiResponse({ status: 409, description: 'Already swiped on this user' })
    async swipe(
        @Request() req,
        @Body() createSwipeDto: CreateSwipeDto,
    ): Promise<SwipeResponseDto> {
        return this.swipeService.recordSwipe(
            req.user.user_id,
            createSwipeDto, // Pass full DTO including message
        );
    }

    @Get('matches')
    @ApiOperation({ summary: 'Get all matches for current user' })
    async getMatches(@Request() req) {
        return this.swipeService.getMatches(req.user.user_id);
    }

    @Get('matches/recent')
    @ApiOperation({ summary: 'Get recent matches for sidebar' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRecentMatches(
        @Request() req,
        @Query('limit') limit?: number,
    ) {
        const matches = await this.swipeService.getRecentMatches(
            req.user.user_id,
            limit ? parseInt(String(limit), 10) : 5,
        );
        return { ok: true, matches };
    }

    @Get('matches/likers')
    @ApiOperation({ summary: 'Get users who liked me (blurred, premium feature)' })
    async getLikers(@Request() req) {
        const likers = await this.swipeService.getLikers(req.user.user_id);
        return { ok: true, likers, count: likers.length };
    }

    @Post('matches/:id/unmatch')
    @ApiOperation({ summary: 'Unmatch with a user and optionally block' })
    @ApiBody({ schema: { properties: { block: { type: 'boolean' } } } })
    async unmatch(
        @Request() req,
        @Param('id') matchId: string,
        @Body('block') block?: boolean,
    ) {
        return this.swipeService.unmatch(req.user.user_id, matchId, block ?? false);
    }

    @Post('report')
    @ApiOperation({ summary: 'Report a user' })
    @ApiBody({ schema: { properties: { targetId: { type: 'string' }, reason: { type: 'string' } } } })
    async reportUser(
        @Request() req,
        @Body('targetId') targetId: string,
        @Body('reason') reason: string,
    ) {
        return this.swipeService.reportUser(req.user.user_id, targetId, reason);
    }

    @Get('superlike-status')
    @ApiOperation({ summary: 'Check if user can send a super like today' })
    async getSuperLikeStatus(@Request() req) {
        return this.swipeService.checkSuperLikeLimit(req.user.user_id);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get suggested users to connect with' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getSuggestedUsers(
        @Request() req,
        @Query('limit') limit?: number,
    ) {
        const users = await this.swipeService.getSuggestedUsers(
            req.user.user_id,
            limit ? parseInt(String(limit), 10) : 5,
        );
        return { ok: true, users };
    }
}

