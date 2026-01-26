import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { VideoSession } from './entities/video-session.entity';
import { VideoDatingService } from './video-dating.service';
import { VideoDatingGateway } from './video-dating.gateway';
import { AiModule } from '../ai/ai.module';
import { UserProfile } from '../user/entities/user-profile.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([VideoSession, UserProfile]),
        JwtModule.register({}),
        AiModule, // 🎬 AI Dating Host integration
    ],
    providers: [VideoDatingService, VideoDatingGateway],
    exports: [VideoDatingService],
})
export class VideoDatingModule { }
