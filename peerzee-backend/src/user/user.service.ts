import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { RegisterDto } from './dto/register.dto';
import { ProfileTag } from './entities/profile-tag.entity';
import { UserSession } from './entities/user-session.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserTag } from './entities/user-tag.entity';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { AddTagDto } from './dto/add-tag.dto';
import { UpdateUserProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    @InjectRepository(UserTag)
    private readonly userTagRepository: EntityRepository<UserTag>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: EntityRepository<UserProfile>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: EntityRepository<UserSession>,
    @InjectRepository(ProfileTag)
    private readonly profileTagRepository: EntityRepository<ProfileTag>,
    private readonly jwt: JwtService,
    private readonly em: EntityManager,
  ) { }

  async register(dto: RegisterDto) {
    const existed = await this.userRepository.findOne({ email: dto.email });
    if (existed) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = new User();
    user.email = dto.email;
    user.password_hash = hashedPassword;
    user.phone = dto.phone || null; // Use null instead of empty string
    this.em.persist(user);

    const profile = new UserProfile();
    profile.user = user;
    profile.display_name = dto.display_name;
    profile.bio = dto.bio;
    profile.location = dto.location;
    this.em.persist(profile);

    await this.em.flush();

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      profile_id: profile.id,
    };
  }

  async login(dto: LoginDto) {
    // Use raw SQL to get password_hash since MikroORM lazy loads protected fields
    const users = await this.em.getConnection().execute<any[]>(
      `SELECT id, email, password_hash FROM users WHERE email = ?`,
      [dto.email]
    );

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = users[0];
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
    const session = new UserSession();
    session.user = user;
    session.refresh_token_hash = refreshTokenHash;
    session.device_hash = await bcrypt.hash(dto.device ?? '', 12);
    await this.em.persistAndFlush(session);

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
      const sessions = await this.userSessionRepository.find({ user: { id: userId } });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refresh_token_hash);
        if (isMatch) {
          await this.em.removeAndFlush(session);
          return { message: 'Logged out successfully' };
        }
      }
    }

    // Delete all sessions for user
    await this.userSessionRepository.nativeDelete({ user: { id: userId } });
    return { message: 'Logged out from all devices' };
  }

  async addTags(tags: AddTagDto) {
    const existedUser = await this.userRepository.findOne({ id: tags.user_id });
    if (!existedUser) throw new NotFoundException('User not found');

    for (const tag of tags.tags) {
      const profileTag = new ProfileTag();
      profileTag.user = existedUser;
      profileTag.tag_type = tag.tag_type;
      profileTag.tag_value = tag.tag_value;
      this.em.persist(profileTag);
    }
    await this.em.flush();
  }

  async getUserProfile(id: string) {
    const user = await this.userRepository.findOne(
      { id: id },
      { populate: ['profile', 'sessions'] }
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserProfile(user_id: string, dto: UpdateUserProfileDto) {
    const profile = await this.userProfileRepository.findOne({ user: { id: user_id } });
    if (!profile) throw new NotFoundException('User profile not found');

    profile.bio = dto.bio;
    profile.display_name = dto.display_name;
    profile.location = dto.location;
    await this.em.persistAndFlush(profile);

    return profile;
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];

    // Use raw SQL for ILIKE search
    const users = await this.em.getConnection().execute<any[]>(
      `SELECT u.id, u.email, p.display_name
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id != ?
       AND (u.email ILIKE ? OR p.display_name ILIKE ?)
       LIMIT 10`,
      [currentUserId, `%${query}%`, `%${query}%`]
    );

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.display_name,
    }));
  }

  /**
   * Update profile properties (intentMode, zodiac, mbti, habits, etc.)
   */
  async updateProfileProperties(
    userId: string,
    dto: { intentMode?: string; profileProperties?: any }
  ) {
    const profile = await this.userProfileRepository.findOne({ user: { id: userId } });
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

    await this.em.persistAndFlush(profile);

    return {
      ok: true,
      intentMode: profile.intentMode,
      profileProperties: profile.profileProperties,
    };
  }
}
