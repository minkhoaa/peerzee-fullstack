import {
    Controller,
    Get,
    Patch,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Logger,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { ProfileService } from './profile.service';
import { SpotifyService } from './spotify.service';
import { MusicService } from '../music/music.service';
import { AiService } from '../ai/ai.service'; // Added AiService import
import {
    UpdateProfileDto,
    AddPhotoDto,
    ReorderPhotosDto,
    ProfileResponseDto,
    UpdateSpotifyDto,
    SetSpotifyTrackDto,
    SetMusicDto,
} from './dto/profile.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
    user: { user_id: string };
}

@ApiTags('Profile')
@Controller('profile')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProfileController {
    private readonly logger = new Logger(ProfileController.name); // Added logger instantiation

    constructor(
        private readonly profileService: ProfileService,
        private readonly aiService: AiService, // Injected AiService
        private readonly spotifyService: SpotifyService, // Injected SpotifyService
        private readonly musicService: MusicService, // Injected MusicService (iTunes)
    ) { }

    /**
     * Get current user's full profile
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile with all rich data' })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    async getMyProfile(@Req() req: AuthRequest): Promise<ProfileResponseDto> {
        this.logger.log(`GET /profile/me - User: ${req.user?.user_id}`); // Added logging
        return this.profileService.getFullProfile(req.user.user_id);
    }

    /**
     * Update current user's profile
     */
    @Patch('me')
    @ApiOperation({ summary: 'Update profile (bio, prompts, tags, discovery settings, etc.)' })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    async updateProfile(
        @Req() req: AuthRequest,
        @Body() dto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        return this.profileService.updateProfile(req.user.user_id, dto);
    }

    /**
     * Add a new photo to profile (by URL)
     */
    @Post('photos')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add a new photo to profile by URL' })
    @ApiResponse({ status: 201, type: ProfileResponseDto })
    async addPhoto(
        @Req() req: AuthRequest,
        @Body() dto: AddPhotoDto,
    ): Promise<ProfileResponseDto> {
        return this.profileService.addPhoto(req.user.user_id, dto);
    }

    /**
     * Upload photo file
     */
    @Post('photos/upload')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Upload a photo file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                isCover: { type: 'boolean' },
            },
        },
    })
    @ApiResponse({ status: 201, type: ProfileResponseDto })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/photos',
                filename: (req, file, cb) => {
                    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
                    cb(new Error('Only image files are allowed'), false);
                } else {
                    cb(null, true);
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    async uploadPhoto(
        @Req() req: AuthRequest,
        @UploadedFile() file: Express.Multer.File,
        @Body('isCover') isCover?: string,
    ): Promise<ProfileResponseDto> {
        const photoUrl = `/uploads/photos/${file.filename}`;
        return this.profileService.addPhoto(req.user.user_id, {
            url: photoUrl,
            isCover: isCover === 'true',
        });
    }

    /**
     * Delete a photo
     */
    @Delete('photos/:photoId')
    @ApiOperation({ summary: 'Delete a photo from profile' })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    async deletePhoto(
        @Req() req: AuthRequest,
        @Param('photoId') photoId: string,
    ): Promise<ProfileResponseDto> {
        return this.profileService.deletePhoto(req.user.user_id, photoId);
    }

    /**
     * Reorder photos
     */
    @Put('photos/order')
    @ApiOperation({ summary: 'Reorder profile photos' })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    async reorderPhotos(
        @Req() req: AuthRequest,
        @Body() dto: ReorderPhotosDto,
    ): Promise<ProfileResponseDto> {
        return this.profileService.reorderPhotos(req.user.user_id, dto);
    }

    /**
     * Get profile stats (matches, likes, views)
     */
    @Get('stats')
    @ApiOperation({ summary: 'Get profile statistics' })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                matches: { type: 'number' },
                likes: { type: 'number' },
                views: { type: 'number' },
            },
        },
    })
    async getStats(@Req() req: AuthRequest): Promise<{ matches: number; likes: number; views: number }> {
        return this.profileService.getProfileStats(req.user.user_id);
    }
    /**
     * AI Profile Doctor - Analyze profile with Gemini
     */
    @Post('analyze')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Analyze profile with AI (Score, Roast, Advice)' })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                score: { type: 'number' },
                roast: { type: 'string' },
                advice: { type: 'string' },
                improved_bios: { type: 'array', items: { type: 'string' } },
            },
        },
    })
    async analyzeProfile(@Req() req: AuthRequest) {
        // 1. Get current profile data
        const profile = await this.profileService.getFullProfile(req.user.user_id);

        // 2. Call AI service
        return this.aiService.analyzeProfile({
            display_name: profile.display_name,
            bio: profile.bio,
            occupation: profile.occupation,
            tags: profile.tags, // Assuming tags is string[] which fits
            intentMode: profile.intentMode,
            age: profile.age,
        });
    }

    /**
     * Search Spotify tracks (proxy endpoint)
     * Vibe Match feature - Step 1: Search for songs
     */
    @Get('spotify/search')
    @ApiOperation({ summary: 'Search Spotify tracks by query' })
    @ApiQuery({ name: 'q', description: 'Search query (song name, artist)', required: true })
    @ApiQuery({ name: 'limit', description: 'Number of results (default: 10, max: 50)', required: false })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                tracks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            artist: { type: 'string' },
                            albumName: { type: 'string' },
                            albumCover: { type: 'string' },
                            previewUrl: { type: 'string' },
                        },
                    },
                },
                total: { type: 'number' },
            },
        },
    })
    async searchSpotifyTracks(
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        return this.spotifyService.searchTracks(query, limit ? parseInt(limit, 10) : 10);
    }

    /**
     * Set Spotify track and analyze vibe with AI
     * Vibe Match feature - Step 2: Select a song and get AI analysis
     */
    @Put('spotify/set')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Set Spotify track by ID and analyze vibe with AI' })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                track: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        artist: { type: 'string' },
                        albumCover: { type: 'string' },
                        previewUrl: { type: 'string' },
                    },
                },
                audioFeatures: {
                    type: 'object',
                    properties: {
                        energy: { type: 'number' },
                        valence: { type: 'number' },
                        danceability: { type: 'number' },
                        tempo: { type: 'number' },
                    },
                },
                analysis: {
                    type: 'object',
                    properties: {
                        mood: { type: 'string' },
                        color: { type: 'string' },
                        keywords: { type: 'array', items: { type: 'string' } },
                        quote: { type: 'string' },
                        description: { type: 'string' },
                        match_vibe: { type: 'string' },
                    },
                },
            },
        },
    })
    async setSpotifyTrack(
        @Req() req: AuthRequest,
        @Body() dto: SetSpotifyTrackDto,
    ) {
        // 1. Fetch full track details + audio features from Spotify
        const trackWithFeatures = await this.spotifyService.getTrackWithFeatures(dto.spotifyTrackId);

        // 2. Call AI service to analyze with audio features
        const analysis = await this.aiService.analyzeMusicVibe(
            trackWithFeatures.name,
            trackWithFeatures.artist,
            trackWithFeatures.audioFeatures,
        );

        // 3. Build complete spotify data object
        const spotifyData = {
            trackId: trackWithFeatures.id,
            song: trackWithFeatures.name,
            artist: trackWithFeatures.artist,
            albumName: trackWithFeatures.albumName,
            albumCover: trackWithFeatures.albumCover,
            previewUrl: trackWithFeatures.previewUrl,
            externalUrl: trackWithFeatures.externalUrl,
            audioFeatures: trackWithFeatures.audioFeatures,
            analysis,
        };

        // 4. Save to UserProfile
        await this.profileService.updateSpotifyData(req.user.user_id, spotifyData);

        return {
            track: {
                id: trackWithFeatures.id,
                name: trackWithFeatures.name,
                artist: trackWithFeatures.artist,
                albumName: trackWithFeatures.albumName,
                albumCover: trackWithFeatures.albumCover,
                previewUrl: trackWithFeatures.previewUrl,
                externalUrl: trackWithFeatures.externalUrl,
                durationMs: trackWithFeatures.durationMs,
            },
            audioFeatures: trackWithFeatures.audioFeatures,
            analysis,
        };
    }

    /**
     * Legacy: Update Spotify song manually (without Spotify API)
     * Kept for backward compatibility
     */
    @Put('spotify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '[Legacy] Update Spotify song manually and analyze vibe' })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                song: { type: 'string' },
                artist: { type: 'string' },
                analysis: {
                    type: 'object',
                    properties: {
                        mood: { type: 'string' },
                        color: { type: 'string' },
                        keywords: { type: 'array', items: { type: 'string' } },
                        quote: { type: 'string' },
                        match_vibe: { type: 'string' },
                    },
                },
            },
        },
    })
    async updateSpotify(
        @Req() req: AuthRequest,
        @Body() dto: UpdateSpotifyDto,
    ) {
        return this.profileService.updateSpotifyWithAnalysis(req.user.user_id, dto);
    }

    // ========================================================================
    // iTunes Music Search + Gemini Audio Analysis (Vibe Match v2)
    // ========================================================================

    /**
     * Search for songs using iTunes API
     * Vibe Match feature - Step 1: Search for songs
     */
    @Get('music/search')
    @ApiOperation({ summary: 'Search songs using iTunes API' })
    @ApiQuery({ name: 'q', description: 'Search query (song name, artist)', required: true })
    @ApiQuery({ name: 'limit', description: 'Number of results (default: 5, max: 50)', required: false })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    song: { type: 'string' },
                    artist: { type: 'string' },
                    cover: { type: 'string' },
                    previewUrl: { type: 'string' },
                    album: { type: 'string' },
                    genre: { type: 'string' },
                },
            },
        },
    })
    async searchMusic(
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        return this.musicService.searchSong(query, limit ? parseInt(limit, 10) : 5);
    }

    /**
     * Set music track and analyze vibe with Gemini audio analysis
     * Vibe Match feature - Step 2: Select a song, AI listens to it
     */
    @Put('music')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Set music track and analyze vibe with Gemini audio AI' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['song', 'artist', 'previewUrl', 'cover'],
            properties: {
                song: { type: 'string', description: 'Song name' },
                artist: { type: 'string', description: 'Artist name' },
                previewUrl: { type: 'string', description: 'Audio preview URL from iTunes' },
                cover: { type: 'string', description: 'Album cover URL' },
                trackId: { type: 'string', description: 'iTunes track ID (optional)' },
                album: { type: 'string', description: 'Album name (optional)' },
                genre: { type: 'string', description: 'Genre (optional)' },
            },
        },
    })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                track: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        song: { type: 'string' },
                        artist: { type: 'string' },
                        cover: { type: 'string' },
                        previewUrl: { type: 'string' },
                    },
                },
                analysis: {
                    type: 'object',
                    properties: {
                        mood: { type: 'string' },
                        color: { type: 'string' },
                        keywords: { type: 'array', items: { type: 'string' } },
                        description: { type: 'string' },
                    },
                },
            },
        },
    })
    async setMusicTrack(
        @Req() req: AuthRequest,
        @Body() dto: SetMusicDto,
    ) {
        // 1. Analyze audio vibe with Gemini (listens to actual audio)
        const analysis = await this.aiService.analyzeAudioVibe(dto.previewUrl, dto.song);

        // 2. Build music data object
        const musicData = {
            trackId: dto.trackId || null,
            song: dto.song,
            artist: dto.artist,
            cover: dto.cover,
            previewUrl: dto.previewUrl,
            album: dto.album || null,
            genre: dto.genre || null,
            analysis,
        };

        // 3. Save to UserProfile.spotify (or music) column
        await this.profileService.updateSpotifyData(req.user.user_id, musicData);

        return {
            track: {
                id: dto.trackId || null,
                song: dto.song,
                artist: dto.artist,
                cover: dto.cover,
                previewUrl: dto.previewUrl,
                album: dto.album,
                genre: dto.genre,
            },
            analysis,
        };
    }
}

