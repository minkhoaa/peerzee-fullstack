import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { SocialPost, SocialComment, SocialLike, SocialVote } from './entities';
import { User } from '../user/entities/user.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { UploadService } from './upload.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([SocialPost, SocialComment, SocialLike, SocialVote, User]),
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
        }),
        forwardRef(() => NotificationModule),
    ],
    controllers: [CommunityController],
    providers: [CommunityService, UploadService],
    exports: [CommunityService],
})
export class CommunityModule { }
