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
    userGender?: string | null;
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
     * This should be synchronous if possible to avoid race conditions
     */
    findCompatibleMatchSynchronous(newUser: Omit<QueuedUser, 'status'> & { embedding: number[] }): QueuedUser | null {
        const waitingUsers = Array.from(this.queue.values())
            .filter(u => u.status === 'WAITING' && u.userId !== newUser.userId)
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (waitingUsers.length === 0) {
            return null;
        }

        let bestMatch: QueuedUser | null = null;
        let highestScore = 0;

        this.logger.log(`🔍 Checking matches for user ${newUser.userId}. Queue size: ${waitingUsers.length}`);

        for (const queuedUser of waitingUsers) {
            this.logger.log(`  -> Evaluating candidate ${queuedUser.userId}`);

            // Check filter compatibility
            const filtersCompatible = this.areFiltersCompatible(newUser as any, queuedUser);
            if (!filtersCompatible) {
                this.logger.log(`     ❌ Filters incompatible: ${JSON.stringify(newUser.filters)} vs ${JSON.stringify(queuedUser.filters)}`);
                continue;
            }

            // Calculate semantic similarity
            const similarity = this.cosineSimilarity(
                newUser.embedding,
                queuedUser.embedding!
            );

            this.logger.log(`     ✅ Filters OK. Similarity: ${similarity.toFixed(4)} (Threshold: 0.6)`);

            if (similarity > highestScore && similarity > 0.6) {
                highestScore = similarity;
                bestMatch = queuedUser;
            }
        }

        if (bestMatch) {
            this.logger.log(`🎉 Match found! ${newUser.userId} <-> ${bestMatch.userId} (Similarity: ${highestScore.toFixed(4)})`);
            // Mark as pending immediately to prevent others from matching
            bestMatch.status = 'MATCH_PENDING';
        } else {
            this.logger.log(`🚫 No compatible match found for user ${newUser.userId}`);
        }

        return bestMatch;
    }

    /**
     * Legacy async version (deprecated, use synchronous version with pre-generated embedding)
     */
    async findCompatibleMatch(newUser: Omit<QueuedUser, 'status'>): Promise<QueuedUser | null> {
        let embedding = newUser.embedding;
        if (!embedding) {
            embedding = await this.aiService.generateEmbedding(newUser.query);
        }
        return this.findCompatibleMatchSynchronous({ ...newUser, embedding } as any);
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
        u1: Omit<QueuedUser, 'status'>,
        u2: Omit<QueuedUser, 'status'>
    ): boolean {
        const f1 = u1.filters;
        const f2 = u2.filters;

        // Diagnostic log - using log instead of debug for guaranteed visibility
        this.logger.log(`      [COMPAT_CHECK] U1(${u1.userId.substring(0, 8)}) seeking=${f1.gender}, is=${u1.userGender} | U2(${u2.userId.substring(0, 8)}) seeking=${f2.gender}, is=${u2.userGender}`);

        // 1. Reciprocal Gender Check (FLEXIBLE: skip if either gender is OTHER or null)
        const u1GenderFlexible = !u1.userGender || u1.userGender.toUpperCase() === 'OTHER';
        const u2GenderFlexible = !u2.userGender || u2.userGender.toUpperCase() === 'OTHER';

        // If U1 is looking for a gender, U2 must be that gender (unless U2 is flexible)
        if (f1.gender && u2.userGender && !u2GenderFlexible) {
            if (f1.gender.toUpperCase() !== u2.userGender.toUpperCase()) {
                this.logger.log(`      ❌ Gender mismatch: U1 wants ${f1.gender}, but U2 is ${u2.userGender}`);
                return false;
            }
        }

        // If U2 is looking for a gender, U1 must be that gender (unless U1 is flexible)
        if (f2.gender && u1.userGender && !u1GenderFlexible) {
            if (f2.gender.toUpperCase() !== u1.userGender.toUpperCase()) {
                this.logger.log(`      ❌ Gender mismatch: U2 wants ${f2.gender}, but U1 is ${u1.userGender}`);
                return false;
            }
        }

        // If both are flexible, always match on gender (skip this check entirely)
        if (u1GenderFlexible && u2GenderFlexible) {
            this.logger.log(`      ℹ️ Both users are gender-flexible (OTHER/null), skipping gender check`);
        }

        // 2. Location compatibility (case-insensitive, trimmed)
        if (f1.location && f2.location) {
            const loc1 = f1.location.trim().toLowerCase();
            const loc2 = f2.location.trim().toLowerCase();
            if (loc1 !== loc2) {
                this.logger.log(`      ❌ Location mismatch: "${loc1}" vs "${loc2}"`);
                return false;
            }
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
