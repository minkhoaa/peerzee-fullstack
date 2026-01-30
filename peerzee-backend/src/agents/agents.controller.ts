import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { UserProfile } from '../user/entities/user-profile.entity';
import { IsString, IsNotEmpty } from 'class-validator';
import { MatchWorkflow } from './workflow';
import { AuthGuard } from '../user/guards/auth.guard';
import { AgentMatchQueueService, QueuedUser } from './agent-match-queue.service';
import { MatchQueueGateway } from './match-queue.gateway';
import { AiService } from '../ai/ai.service';
import { v4 as uuid } from 'uuid';

class MatchQueryDto {
    @IsString()
    @IsNotEmpty()
    query: string;
}

@Controller('agents')
@UseGuards(AuthGuard)
export class AgentsController {
    private readonly logger = new Logger(AgentsController.name);

    constructor(
        private readonly matchWorkflow: MatchWorkflow,
        private readonly queueService: AgentMatchQueueService,
        private readonly matchGateway: MatchQueueGateway,
        private readonly aiService: AiService,
        @InjectRepository(UserProfile)
        private readonly profileRepo: EntityRepository<UserProfile>,
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

        // If match found immediately in database via RAG
        if (result.finalMatch) {
            const matchedUserId = result.finalMatch.profile.id;

            // CRITICAL: Only accept RAG match if the user is currently in our queue and WAITING
            const queueEntry = this.queueService.getUserData(matchedUserId);

            if (queueEntry && queueEntry.status === 'WAITING') {
                // Create roomId for video chat
                const roomId = `room_${Date.now()}_${uuid()}`;

                // Lock the pair to prevent double matching
                this.queueService.lockMatchPair(matchedUserId, userId, roomId);

                // Auto-redirect both users to video chat
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
                    fromQueue: true, // It's from the queue now
                    roomId,
                };
            } else {
                this.logger.log(`⚠️ RAG suggested match ${matchedUserId} but user is not available in queue. Falling back to queue search...`);
            }
        }

        // No immediate match - check queue for compatible waiting user
        const embedding = await this.aiService.generateEmbedding(dto.query);
        const userProfile = await this.profileRepo.findOne({ user: { id: userId } });
        const userGender = userProfile?.gender || null;

        this.logger.log(`[QUEUE_ADD] User ${userId} is gender: ${userGender}. Filters: ${JSON.stringify(result.filters)}`);

        const newUserData: Omit<QueuedUser, 'status'> & { embedding: number[] } = {
            userId,
            query: dto.query,
            filters: result.filters,
            userGender,
            timestamp: new Date(),
            socketId: userId,
            embedding,
        };

        const queueMatch = this.queueService.findCompatibleMatchSynchronous(newUserData);

        if (queueMatch) {
            // Found someone waiting in queue!
            const roomId = `room_${Date.now()}_${uuid()}`;

            // Lock the pair to prevent double matching
            this.queueService.lockMatchPair(queueMatch.userId, userId, roomId);

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
