import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { SocialPost, SocialComment, SocialLike, SocialVote } from './entities';
import { ModerationViolation } from './entities/moderation-violation.entity';
import { User } from '../user/entities/user.entity';
import { UserGamification } from '../gamification/entities/user-gamification.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { UploadService } from './upload.service';
import { ModerationService } from './moderation.service';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([
            SocialPost,
            SocialComment,
            SocialLike,
            SocialVote,
            User,
            ModerationViolation,
            UserGamification,
        ]),
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '7d' },
            }),
        }),
        forwardRef(() => NotificationModule),
        AiModule,
        forwardRef(() => GamificationModule),
    ],
    controllers: [CommunityController],
    providers: [CommunityService, UploadService, ModerationService],
    exports: [CommunityService, ModerationService],
})
export class CommunityModule {}