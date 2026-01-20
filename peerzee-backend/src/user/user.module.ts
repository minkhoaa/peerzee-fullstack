import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { SeedController } from './seed.controller';
import { ProfileService } from './profile.service';
import { SeedService } from './seed.service';
import { UserProfile } from './entities/user-profile.entity';
import { UserTag } from './entities/user-tag.entity';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { ProfileTag } from './entities/profile-tag.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserTag, UserProfile, UserSession, ProfileTag]),
    AiModule,
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
  providers: [UserService, ProfileService, SeedService],
  exports: [UserService, ProfileService, SeedService],
})
export class UserModule { }