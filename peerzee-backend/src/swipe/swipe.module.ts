import { Module, forwardRef } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SwipeService } from './swipe.service';
import { SwipeController } from './swipe.controller';
import { MatchGateway } from './match.gateway';
import { UserSwipe } from './entities/user-swipe.entity';
import { Match } from './entities/match.entity';
import { User } from '../user/entities/user.entity';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notification/notification.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([UserSwipe, Match, User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET,
                signOptions: { expiresIn: '1h' },
            }),
            inject: [ConfigService],
        }),
        ChatModule,
        NotificationModule,
        GamificationModule,
    ],
    controllers: [SwipeController],
    providers: [SwipeService, MatchGateway],
    exports: [SwipeService, MatchGateway],
})
export class SwipeModule { }
