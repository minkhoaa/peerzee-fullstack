import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { VideoSession } from './entities/video-session.entity';
import { VideoDatingService } from './video-dating.service';
import { VideoDatingGateway } from './video-dating.gateway';
import { AiModule } from '../ai/ai.module';
import { UserProfile } from '../user/entities/user-profile.entity';
import { AgentsModule } from '../agents/agents.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([VideoSession, UserProfile]),
        JwtModule.register({}),
        AiModule, // 🎬 AI Dating Host integration
        AgentsModule, // 🤖 RAG Matchmaker Agent
    ],
    providers: [VideoDatingService, VideoDatingGateway],
    exports: [VideoDatingService],
})
export class VideoDatingModule { }
