import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SocialPost, SocialComment, SocialLike, SocialVote } from './entities';
import { User } from '../user/entities/user.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { UploadService } from './upload.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([SocialPost, SocialComment, SocialLike, SocialVote, User]),
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [CommunityController],
    providers: [CommunityService, UploadService],
    exports: [CommunityService],
})
export class CommunityModule { }
