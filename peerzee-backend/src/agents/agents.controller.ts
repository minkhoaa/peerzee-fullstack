import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { MatchWorkflow } from './workflow';
import { AuthGuard } from '../user/guards/auth.guard';
import { AgentMatchQueueService } from './agent-match-queue.service';
import { MatchQueueGateway } from './match-queue.gateway';
import { v4 as uuid } from 'uuid';

class MatchQueryDto {
    @IsString()
    @IsNotEmpty()
    query: string;
}

@Controller('agents')
@UseGuards(AuthGuard)
export class AgentsController {
    constructor(
        private readonly matchWorkflow: MatchWorkflow,
        private readonly queueService: AgentMatchQueueService,
        private readonly matchGateway: MatchQueueGateway,
    ) { }

    /**
     * POST /agents/match
     * Run the RAG Matchmaker Agent
     * If no match, add to queue and wait for compatible user
     */
    @Post('match')
    async runMatchAgent(@Request() req: any, @Body() dto: MatchQueryDto) {
        const userId = req.user?.user_id || req.user?.sub;

        // Run workflow to find immediate match in database
        const result = await this.matchWorkflow.runWorkflow(dto.query, userId);

        // If match found immediately in database
        if (result.finalMatch) {
            // Create roomId for video chat
            const roomId = `room_${Date.now()}_${uuid()}`;
            const matchedUserId = result.finalMatch.profile.id;

            // Auto-redirect both users to video chat (matched user may not be online)
            this.matchGateway.emitGoToRoom(userId, roomId);
            this.matchGateway.emitGoToRoom(matchedUserId, roomId);

            return {
                ok: true,
                query: dto.query,
                steps: result.steps,
                filters: result.filters,
                candidateCount: result.candidates.length,
                match: {
                    profile: {
                        id: result.finalMatch.profile.id,
                        display_name: result.finalMatch.profile.display_name,
                        bio: result.finalMatch.profile.bio,
                        occupation: result.finalMatch.profile.occupation,
                        tags: result.finalMatch.profile.tags,
                        matchScore: result.finalMatch.profile.matchScore,
                    },
                    reasoning: result.finalMatch.reasoning,
                },
                fromQueue: false,
                roomId, // Include roomId for frontend
            };
        }

        // No immediate match - check queue for compatible waiting user
        const newUserData = {
            userId,
            query: dto.query,
            filters: result.filters,
            timestamp: new Date(),
            socketId: userId,
        };

        const queueMatch = await this.queueService.findCompatibleMatch(newUserData);

        if (queueMatch) {
            // Found someone waiting in queue!
            const roomId = `room_${Date.now()}_${uuid()}`;

            // Auto-redirect both users to video chat
            this.matchGateway.emitGoToRoom(queueMatch.userId, roomId);
            this.matchGateway.emitGoToRoom(userId, roomId);

            return {
                ok: true,
                query: dto.query,
                steps: [...result.steps, '[QUEUE] Match found in waiting queue'],
                filters: result.filters,
                match: {
                    profile: {
                        id: queueMatch.userId,
                        display_name: `User_${queueMatch.userId.substring(0, 8)}`,
                    },
                    reasoning: `Matched based on similar search: "${queueMatch.query}"`,
                },
                fromQueue: true,
                roomId,
            };
        }

        // No match found anywhere - add to queue
        await this.queueService.addToQueue(newUserData);
        const position = this.queueService.getQueueStats(userId).position;
        const totalInQueue = this.queueService.getQueueStats(userId).total;

        // Notify user they're in queue (will be updated via QUEUE_UPDATE broadcast)
        this.matchGateway.emitWaiting(userId, position, totalInQueue);

        return {
            ok: true,
            query: dto.query,
            steps: [...result.steps, '[QUEUE] Searching for compatible matches...'],
            filters: result.filters,
            match: null,
            inQueue: true,
            queuePosition: position,
            totalInQueue,
        };
    }
}
