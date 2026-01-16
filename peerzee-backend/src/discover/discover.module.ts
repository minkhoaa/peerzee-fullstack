import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoverController } from './discover.controller';
import { DiscoverService } from './discover.service';
import { UserSwipe } from '../swipe/entities/user-swipe.entity';
import { Match } from '../swipe/entities/match.entity';
import { User } from '../user/entities/user.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserSwipe, Match, User]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET,
                signOptions: { expiresIn: '8h' },
            }),
            inject: [ConfigService],
        }),
        forwardRef(() => ChatModule),
    ],
    controllers: [DiscoverController],
    providers: [DiscoverService],
    exports: [DiscoverService],
})
export class DiscoverModule { }
