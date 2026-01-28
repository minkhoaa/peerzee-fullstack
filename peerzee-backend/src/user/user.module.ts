import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { SeedController } from './seed.controller';
import { ProfileService } from './profile.service';
import { SeedService } from './seed.service';
import { SpotifyService } from './spotify.service';
import { UserProfile } from './entities/user-profile.entity';
import { UserTag } from './entities/user-tag.entity';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { ProfileTag } from './entities/profile-tag.entity';
import { AiModule } from '../ai/ai.module';
import { MusicModule } from '../music/music.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([User, UserTag, UserProfile, UserSession, ProfileTag]),
    AiModule,
    MusicModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController, ProfileController, SeedController],
  providers: [UserService, ProfileService, SeedService, SpotifyService],
  exports: [UserService, ProfileService, SeedService, SpotifyService],
})
export class UserModule { }