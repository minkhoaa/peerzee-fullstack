import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

export type UserStatus = 'WAITING' | 'MATCH_PENDING' | 'IN_ROOM';

export interface QueuedUser {
    userId: string;
    query: string;
    filters: {
        gender: string | null;
        location: string | null;
        semantic_topic: string;
    };
    timestamp: Date;
    socketId: string;
    embedding?: number[];
    status: UserStatus;
}

export interface MatchPair {
    partnerId: string;
    role: 'INITIATOR' | 'RECEIVER';
    roomId: string;
    timestamp: Date;
}

@Injectable()
export class AgentMatchQueueService {
    private readonly logger = new Logger(AgentMatchQueueService.name);
    private queue: Map<string, QueuedUser> = new Map();
    private matchPairs: Map<string, MatchPair> = new Map(); // userId -> MatchPair

    constructor(private readonly aiService: AiService) { }

    /**
     * Add user to waiting queue
     */
    async addToQueue(user: Omit<QueuedUser, 'status'>): Promise<void> {
        // Generate embedding for semantic matching
        if (!user.embedding) {
            const embedding = await this.aiService.generateEmbedding(user.query);
            user.embedding = embedding;
        }

        const queuedUser: QueuedUser = {
            ...user,
            status: 'WAITING',
        };

        this.queue.set(user.userId, queuedUser);
        this.logger.log(`User ${user.userId} added to queue. Queue size: ${this.queue.size}`);
    }

    /**
     * Find compatible match in queue using semantic similarity
     */
    async findCompatibleMatch(newUser: Omit<QueuedUser, 'status'>): Promise<QueuedUser | null> {
        const waitingUsers = Array.from(this.queue.values()).filter(
            u => u.status === 'WAITING' && u.userId !== newUser.userId
        );

        if (waitingUsers.length === 0) {
            return null;
        }

        // Generate embedding for new user
        if (!newUser.embedding) {
            newUser.embedding = await this.aiService.generateEmbedding(newUser.query);
        }

        let bestMatch: QueuedUser | null = null;
        let highestScore = 0;

        for (const queuedUser of waitingUsers) {
            // Skip self
            if (queuedUser.userId === newUser.userId) continue;

            // Check filter compatibility
            if (!this.areFiltersCompatible(newUser.filters, queuedUser.filters)) {
                continue;
            }

            // Calculate semantic similarity
            const similarity = this.cosineSimilarity(
                newUser.embedding!,
                queuedUser.embedding!
            );

            this.logger.debug(`Similarity with ${queuedUser.userId}: ${similarity}`);

            if (similarity > highestScore && similarity > 0.7) {
                highestScore = similarity;
                bestMatch = queuedUser;
            }
        }

        if (bestMatch) {
            this.logger.log(`Match found! Similarity: ${highestScore}`);
        }

        return bestMatch;
    }

    /**
     * Lock both users when match is proposed
     */
    lockMatchPair(userA: string, userB: string, roomId: string): void {
        // Update status in queue
        const userAData = this.queue.get(userA);
        const userBData = this.queue.get(userB);

        if (userAData) {
            userAData.status = 'MATCH_PENDING';
        }
        if (userBData) {
            userBData.status = 'MATCH_PENDING';
        }

        // Store match pairs
        this.matchPairs.set(userA, {
            partnerId: userB,
            role: 'RECEIVER', // User A was waiting
            roomId,
            timestamp: new Date(),
        });

        this.matchPairs.set(userB, {
            partnerId: userA,
            role: 'INITIATOR', // User B just searched
            roomId,
            timestamp: new Date(),
        });

        this.logger.log(`Locked match pair: ${userA} (RECEIVER) <-> ${userB} (INITIATOR)`);
    }

    /**
     * Release user from match (back to queue or remove)
     */
    releaseFromMatch(userId: string): void {
        const pair = this.matchPairs.get(userId);
        if (pair) {
            // Release partner
            this.matchPairs.delete(pair.partnerId);

            // Update status back to WAITING
            const userData = this.queue.get(pair.partnerId);
            if (userData) {
                userData.status = 'WAITING';
            }
        }

        // Remove from match pairs
        this.matchPairs.delete(userId);

        // Remove from queue if exists
        this.queue.delete(userId);

        this.logger.log(`Released user ${userId} from match`);
    }

    /**
     * Remove user from queue
     */
    removeFromQueue(userId: string): void {
        const removed = this.queue.delete(userId);
        this.matchPairs.delete(userId);

        if (removed) {
            this.logger.log(`User ${userId} removed from queue`);
        }
    }

    /**
     * Get queue statistics for a user
     */
    getQueueStats(userId: string): { position: number; total: number; estimatedWait: string } {
        const waitingUsers = Array.from(this.queue.values())
            .filter(u => u.status === 'WAITING')
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        const position = waitingUsers.findIndex(u => u.userId === userId) + 1;
        const total = waitingUsers.length;

        // Estimate wait time based on position
        let estimatedWait = 'Unknown';
        if (position > 0) {
            if (position === 1) estimatedWait = '< 1 min';
            else if (position <= 3) estimatedWait = '1-2 mins';
            else if (position <= 5) estimatedWait = '2-5 mins';
            else estimatedWait = '> 5 mins';
        }

        return { position, total, estimatedWait };
    }

    /**
     * Get all waiting users for QUEUE_UPDATE broadcast
     */
    getWaitingUsers(): QueuedUser[] {
        return Array.from(this.queue.values()).filter(u => u.status === 'WAITING');
    }

    /**
     * Get match pair info
     */
    getMatchPair(userId: string): MatchPair | undefined {
        return this.matchPairs.get(userId);
    }

    /**
     * Get user data
     */
    getUserData(userId: string): QueuedUser | undefined {
        return this.queue.get(userId);
    }

    /**
     * Check if filters are compatible between two users
     */
    private areFiltersCompatible(
        f1: QueuedUser['filters'],
        f2: QueuedUser['filters']
    ): boolean {
        // Gender compatibility
        if (f1.gender && f2.gender && f1.gender === f2.gender) {
            return false;
        }

        // Location compatibility
        if (f1.location && f2.location && f1.location !== f2.location) {
            return false;
        }

        return true;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) {
            return 0;
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
}
