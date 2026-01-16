import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ProfileTag } from './entities/profile-tag.entity';
import { UserSession } from './entities/user-session.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserTag } from './entities/user-tag.entity';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { AddTagDto } from './dto/add-tag.dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTag)
    private readonly userTagRepository: Repository<UserTag>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    @InjectRepository(ProfileTag)
    private readonly profileTagRepository: Repository<ProfileTag>,
    private readonly jwt: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const existed = await this.userRepository.findOneBy({ email: dto.email });
    if (existed) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepository.save({
      email: dto.email,
      password_hash: hashedPassword,
      phone: dto.phone,
    });
    const profile = await this.userProfileRepository.save({
      user_id: user.id,
      display_name: dto.display_name,
      bio: dto.bio,
      location: dto.location,
    });
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profile_id: profile.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .where('user.email = :email', { email: dto.email })
      .getOne();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwt.sign(
      { sub: user.id, user_id: user.id },
      { expiresIn: '8h' },
    );
    const refreshToken = this.jwt.sign(
      { sub: user.id, user_id: user.id, type: 'refresh' },
      { expiresIn: '7d' },
    );

    // Hash refresh token before storing
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.userSessionRepository.save({
      user_id: user.id,
      refresh_token_hash: refreshTokenHash,
      device_hash: await bcrypt.hash(dto.device ?? '', 12),
    });

    return { user_id: user.id, token, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Generate new access token
      const newToken = this.jwt.sign(
        { sub: payload.sub, user_id: payload.user_id },
        { expiresIn: '8h' },
      );

      return { token: newToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific session
      const sessions = await this.userSessionRepository.find({
        where: { user_id: userId },
      });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refresh_token_hash);
        if (isMatch) {
          await this.userSessionRepository.delete(session.id);
          return { message: 'Logged out successfully' };
        }
      }
    }

    // Delete all sessions for user
    await this.userSessionRepository.delete({ user_id: userId });
    return { message: 'Logged out from all devices' };
  }

  async addTags(tags: AddTagDto) {
    const existedUser = await this.userRepository.findOne({
      where: { id: tags.user_id },
    });
    if (!existedUser) throw new NotFoundException('User not found');

    for (const tag of tags.tags) {
      await this.profileTagRepository.save({
        user_id: tags.user_id,
        tag_type: tag.tag_type,
        tag_value: tag.tag_value,
      });
    }
  }

  async getUserProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['profile', 'sessions'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserProfile(user_id: string, dto: UpdateUserProfileDto) {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: user_id },
    });
    if (!profile) throw new NotFoundException('User profile not found');

    const updatedProfile = await this.userProfileRepository.save({
      id: profile.id,
      user_id: user_id,
      bio: dto.bio,
      display_name: dto.display_name,
      location: dto.location,
    });
    return updatedProfile;
  }
  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere(
        '(user.email ILIKE :query OR profile.display_name ILIKE :query)',
        { query: `%${query}%` }
      )
      .limit(10)
      .getMany();

    return users.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.profile?.display_name,
    }));
  }

  /**
   * Update profile properties (intentMode, zodiac, mbti, habits, etc.)
   */
  async updateProfileProperties(
    userId: string,
    dto: { intentMode?: string; profileProperties?: any }
  ) {
    const profile = await this.userProfileRepository.findOne({
      where: { user_id: userId },
    });
    if (!profile) throw new NotFoundException('User profile not found');

    // Update intentMode if provided
    if (dto.intentMode) {
      profile.intentMode = dto.intentMode as any;
    }

    // Merge profileProperties if provided
    if (dto.profileProperties) {
      profile.profileProperties = {
        ...(profile.profileProperties || {}),
        ...dto.profileProperties,
      } as any;
    }

    const updated = await this.userProfileRepository.save(profile);
    return {
      ok: true,
      intentMode: updated.intentMode,
      profileProperties: updated.profileProperties,
    };
  }
}


