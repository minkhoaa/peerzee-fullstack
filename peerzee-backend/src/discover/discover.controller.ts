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
     * Optional location-based filtering with Haversine formula
     */
    @Get('recommendations')
    @ApiOperation({ summary: 'Get recommended users with cursor pagination' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Cursor for pagination' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 10)' })
    @ApiQuery({ name: 'lat', required: false, type: Number, description: 'User latitude for distance-based search' })
    @ApiQuery({ name: 'long', required: false, type: Number, description: 'User longitude for distance-based search' })
    @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in km (default: 50)' })
    @ApiResponse({ status: 200, description: 'Paginated list of recommended users' })
    async getRecommendations(
        @Request() req,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
        @Query('lat') lat?: string,
        @Query('long') long?: string,
        @Query('radius') radius?: string,
    ): Promise<PaginatedRecommendationsDto | { data: DiscoverUserDto[]; total: number }> {
        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 10;

            // If lat/long provided, use dedicated location-based method
            if (lat && long) {
                const userLat = parseFloat(lat);
                const userLong = parseFloat(long);
                const radiusInKm = radius ? parseInt(radius, 10) : 50;

                if (isNaN(userLat) || isNaN(userLong)) {
                    throw new HttpException('Invalid lat/long parameters', HttpStatus.BAD_REQUEST);
                }

                this.logger.log(
                    `Location-based search for user ${req.user.user_id}: (${userLat}, ${userLong}), radius: ${radiusInKm}km`,
                );

                const result = await this.discoverService.getRecommendationsByLocation(
                    req.user.user_id,
                    userLat,
                    userLong,
                    radiusInKm,
                    Math.min(parsedLimit, 50),
                );

                return result;
            }

            // Default: cursor-based pagination with optional location filtering
            // Uses user's profile location if available
            const radiusInKm = radius ? parseInt(radius, 10) : undefined;
            const result = await this.discoverService.getRecommendations(
                req.user.user_id,
                cursor,
                Math.min(parsedLimit, 50), // Max 50 per request
                undefined, // userLat - will be read from profile
                undefined, // userLong - will be read from profile
                radiusInKm,
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

    /**
     * GET /discover/search?q=...
     * Hybrid Semantic Search using natural language
     * Optional location-based filtering with Haversine formula
     * Example: "Tìm bạn nữ học AI ở Hà Nội"
     */
    @Get('search')
    @ApiOperation({ summary: 'Search users with natural language query (Hybrid AI Search)' })
    @ApiQuery({ name: 'q', required: true, description: 'Natural language search query' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 10)' })
    @ApiQuery({ name: 'lat', required: false, type: Number, description: 'User latitude for distance filtering' })
    @ApiQuery({ name: 'long', required: false, type: Number, description: 'User longitude for distance filtering' })
    @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Search radius in km' })
    @ApiResponse({ status: 200, description: 'Search results with match scores' })
    async search(
        @Request() req,
        @Query('q') query: string,
        @Query('limit') limit?: string,
        @Query('lat') lat?: string,
        @Query('long') long?: string,
        @Query('radius') radius?: string,
    ) {
        if (!query?.trim()) {
            throw new HttpException('Query parameter "q" is required', HttpStatus.BAD_REQUEST);
        }

        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 10;
            const userLat = lat ? parseFloat(lat) : undefined;
            const userLong = long ? parseFloat(long) : undefined;
            const radiusInKm = radius ? parseInt(radius, 10) : undefined;

            if ((userLat !== undefined || userLong !== undefined) && (isNaN(userLat!) || isNaN(userLong!))) {
                throw new HttpException('Invalid lat/long parameters', HttpStatus.BAD_REQUEST);
            }

            const result = await this.discoverService.searchUsers(
                query.trim(),
                req.user.user_id,
                Math.min(parsedLimit, 50),
                userLat,
                userLong,
                radiusInKm,
            );

            return {
                query,
                filters: result.filters,
                count: result.results.length,
                results: result.results,
            };
        } catch (error) {
            this.logger.error(`Search error: ${error.message}`, error.stack);
            throw new HttpException(
                `Search failed: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}

