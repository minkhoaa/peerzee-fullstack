import { Controller, Post, Body, Get, Param, Put, Patch, UseGuards, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';
import { UpdatePropertiesDto } from './dto/update-properties.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) { }

  // ========== Public Routes ==========

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.userService.refreshToken(dto.refreshToken);
  }


  @UseGuards(AuthGuard)
  @Post('logout')
  logout(
    @CurrentUser('user_id') userId: string,
    @Body('refreshToken') refreshToken?: string,
  ) {
    return this.userService.logout(userId, refreshToken);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getMyProfile(@CurrentUser('user_id') userId: string) {
    return this.userService.getUserProfile(userId);
  }
  @UseGuards(AuthGuard)
  @Get('search')
  searchUsers(@Query('q') query: string, @CurrentUser('user_id') userId: string) {
    return this.userService.searchUsers(query, userId);
  }
  @UseGuards(AuthGuard)
  @Get('profile/:id')
  getUserProfile(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }

  @UseGuards(AuthGuard)
  @Put('profile')
  updateMyProfile(
    @CurrentUser('user_id') userId: string,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.userService.updateUserProfile(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Post('add-tag')
  addProfileTag(@Body() addTag: AddTagDto) {
    return this.userService.addTags(addTag);
  }

  /**
   * Update profile properties (intentMode, zodiac, mbti, habits, etc.)
   */
  @UseGuards(AuthGuard)
  @Patch('profile/properties')
  updateProfileProperties(
    @CurrentUser('user_id') userId: string,
    @Body() dto: UpdatePropertiesDto,
  ) {
    return this.userService.updateProfileProperties(userId, dto);
  }

  /**
   * Admin endpoint: Bulk re-index all profiles with AI embeddings
   * POST /user/reindex-all?batchSize=10
   */
  @Post('reindex-all')
  async reindexAllProfiles(@Query('batchSize') batchSize?: string) {
    const size = batchSize ? parseInt(batchSize, 10) : 10;
    return this.profileService.reindexAllProfiles(size);
  }
}
