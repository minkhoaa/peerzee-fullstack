import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '@nestjs/jwt';
import { VideoSession } from './entities/video-session.entity';
import { VideoDatingService } from './video-dating.service';
import { VideoDatingGateway } from './video-dating.gateway';
import { TranslationService } from './translation.service';
import { TopicGeneratorService } from './topic-generator.service';
import { AiModule } from '../ai/ai.module';
import { UserProfile } from '../user/entities/user-profile.entity';
import { AgentsModule } from '../agents/agents.module';
import { WhisperModule } from '../whisper/whisper.module';

@Module({
    imports: [
        MikroOrmModule.forFeature([VideoSession, UserProfile]),
        JwtModule.register({}),
        AiModule, // 🎬 AI Dating Host integration
        AgentsModule, // 🤖 RAG Matchmaker Agent
        WhisperModule, // 🎤 Local Whisper transcription
    ],
    providers: [
        VideoDatingService, 
        VideoDatingGateway,
        TranslationService, // 🌍 Real-time translation
        TopicGeneratorService, // 💬 AI topic suggestions
    ],
    exports: [VideoDatingService, TranslationService, TopicGeneratorService],
})
export class VideoDatingModule { }
