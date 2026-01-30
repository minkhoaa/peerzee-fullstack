import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AgentsController } from './agents.controller';
import { MatchWorkflow } from './workflow';
import { MatchNodes } from './matchNodes';
import { DiscoverModule } from '../discover/discover.module';
import { AgentMatchQueueService } from './agent-match-queue.service';
import { MatchQueueGateway } from './match-queue.gateway';
import { AiModule } from '../ai/ai.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' },
        }),
        DiscoverModule,
        AiModule,
    ],
    controllers: [AgentsController],
    providers: [MatchWorkflow, MatchNodes, AgentMatchQueueService, MatchQueueGateway],
    exports: [MatchWorkflow, AgentMatchQueueService],
})
export class AgentsModule { }
