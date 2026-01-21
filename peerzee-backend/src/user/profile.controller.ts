import {
    Controller,
    Get,
    Patch,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { ProfileService } from './profile.service';
import {
    UpdateProfileDto,
    AddPhotoDto,
    ReorderPhotosDto,
    ProfileResponseDto,
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
    constructor(private readonly profileService: ProfileService) { }

    /**
     * Get current user's full profile
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile with all rich data' })
    @ApiResponse({ status: 200, type: ProfileResponseDto })
    async getMyProfile(@Req() req: AuthRequest): Promise<ProfileResponseDto> {
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
}

