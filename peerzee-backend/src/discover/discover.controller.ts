import {
    Controller,
    Get,
    Post,
    Body,
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
} from '@nestjs/swagger';
import { DiscoverService, DiscoverUserDto, SwipeResult } from './discover.service';
import { AuthGuard } from '../user/guards/auth.guard';

// DTOs
export class SwipeDto {
    targetId: string;
    action: 'LIKE' | 'PASS' | 'SUPER_LIKE';
    message?: string;
    likedContentId?: string;
    likedContentType?: 'photo' | 'prompt' | 'vibe';
}

export class PaginatedRecommendationsDto {
    data: DiscoverUserDto[];
    nextCursor: string | null;
    hasMore: boolean;
}

@ApiTags('Discover')
@Controller('discover')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DiscoverController {
    private readonly logger = new Logger(DiscoverController.name);

    constructor(private readonly discoverService: DiscoverService) { }

    /**
     * GET /discover/recommendations
     * Cursor-based pagination for infinite scroll
     */
    @Get('recommendations')
    @ApiOperation({ summary: 'Get recommended users with cursor pagination' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 10)' })
    @ApiResponse({ status: 200, description: 'Paginated list of recommended users' })
    async getRecommendations(
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ): Promise<PaginatedRecommendationsDto> {
        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 10;
            const result = await this.discoverService.getRecommendations(
                req.user.user_id,
                cursor,
                Math.min(parsedLimit, 50), // Max 50 per request
            );
            this.logger.log(
                `Returning ${result.data.length} recommendations for user ${req.user.user_id}`,
            );
            return result;
        } catch (error) {
            this.logger.error(`Recommendations error: ${error.message}`, error.stack);
            throw new HttpException(
                `Failed to get recommendations: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /**
     * POST /discover/swipe
     * Record swipe action with optional message (Hinge-style)
     */
    @Post('swipe')
    @ApiOperation({ summary: 'Swipe on a user with optional message' })
    @ApiResponse({ status: 201, description: 'Swipe recorded, returns match info if applicable' })
    async swipe(@Request() req, @Body() dto: SwipeDto): Promise<SwipeResult> {
        try {
            return await this.discoverService.recordSwipe(req.user.user_id, dto);
        } catch (error) {
            this.logger.error(`Swipe error: ${error.message}`, error.stack);
            throw new HttpException(
                error.message || 'Failed to record swipe',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
