import {
    Controller,
    Get,
    Patch,
    Post,
    Put,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from './guards/auth.guard';
import { ProfileService } from './profile.service';
import {
    UpdateProfileDto,
    AddPhotoDto,
    ReorderPhotosDto,
    ProfileResponseDto,
} from './dto/profile.dto';

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
     * Add a new photo to profile
     */
    @Post('photos')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add a new photo to profile' })
    @ApiResponse({ status: 201, type: ProfileResponseDto })
    async addPhoto(
        @Req() req: AuthRequest,
        @Body() dto: AddPhotoDto,
    ): Promise<ProfileResponseDto> {
        return this.profileService.addPhoto(req.user.user_id, dto);
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
}
