import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { VideoSession } from './entities/video-session.entity';

export interface QueueEntry {
    userId: string;
    socketId: string;
    intentMode: string;
    genderPreference: string;
    gender?: string;
    displayName?: string;
    joinedAt: Date;
    // AI-based matching data
    embedding?: number[];  // 768-dim vector for similarity
    bio?: string;
    tags?: string[];
    age?: number;
    // Location for Haversine matching
    latitude?: number;
    longitude?: number;
}

/**
 * 🎬 AI DATING HOST: Active Session State
 * Tracks the "game state" of each blind date session
 */
export interface ActiveBlindSession {
    sessionId: string;
    participants: [string, string]; // User IDs
    blurLevel: number; // Starts at 20px, decreases over time
    startTime: Date;
    topicHistory: string[];
    currentTopic: string;
    lastActivityTime: Date; // For silence detection
    introMessage: string;
    revealTriggered: boolean; // Has the full reveal happened?
}

@Injectable()
export class VideoDatingService {
    private readonly logger = new Logger(VideoDatingService.name);

    // In-memory queue (for simplicity, could use Redis in production)
    private queue: Map<string, QueueEntry> = new Map();

    // 🎬 AI DATING HOST: Track active blind date sessions
    private blindSessions: Map<string, ActiveBlindSession> = new Map();

    constructor(
        @InjectRepository(VideoSession)
        private readonly sessionRepo: EntityRepository<VideoSession>,
        private readonly em: EntityManager,
    ) { }

    addToQueue(entry: QueueEntry): void {
        this.queue.set(entry.userId, entry);
    }

    removeFromQueue(userId: string): void {
        this.queue.delete(userId);
    }

    isInQueue(userId: string): boolean {
        return this.queue.has(userId);
    }

    getQueueEntry(userId: string): QueueEntry | undefined {
        return this.queue.get(userId);
    }

    /**
     * 🤖 AI-POWERED MATCHING: Find best match using vector similarity
     * Match criteria:
     * 1. Same intentMode (hard filter)
     * 2. Gender preference compatible (hard filter)
     * 3. Highest embedding cosine similarity (AI ranking)
     */
    findMatch(userId: string): QueueEntry | null {
        const currentUser = this.queue.get(userId);
        if (!currentUser) {
            this.logger.debug(`findMatch: User ${userId} not in queue`);
            return null;
        }

        if (!currentUser.embedding) {
            this.logger.warn(`findMatch: User ${userId} has no embedding, falling back to first match`);
            // Fallback to simple matching if no embedding
            return this.findSimpleMatch(userId);
        }

        this.logger.debug(`findMatch: 🤖 AI matching for user ${userId}, intentMode=${currentUser.intentMode}`);
        this.logger.debug(`findMatch: Current queue size: ${this.queue.size}`);

        let bestMatch: QueueEntry | null = null;
        let bestSimilarity = -1;

        for (const [candidateId, candidate] of this.queue.entries()) {
            if (candidateId === userId) {
                continue;
            }

            // Hard filter: Same intent mode
            if (candidate.intentMode !== currentUser.intentMode) {
                continue;
            }

            // Hard filter: Gender preference compatibility
            const userPref = currentUser.genderPreference;
            const candidatePref = candidate.genderPreference;
            const userGender = currentUser.gender || 'unknown';
            const candidateGender = candidate.gender || 'unknown';

            const bothAcceptAll = userPref === 'all' && candidatePref === 'all';
            const userWantsCandidate = userPref === 'all' || userPref === candidateGender;
            const candidateWantsUser = candidatePref === 'all' || candidatePref === userGender;

            if (!bothAcceptAll && !(userWantsCandidate && candidateWantsUser)) {
                continue;
            }

            // Calculate cosine similarity if candidate has embedding
            if (candidate.embedding) {
                const similarity = this.cosineSimilarity(currentUser.embedding, candidate.embedding);
                this.logger.debug(`findMatch: Candidate ${candidateId} similarity: ${similarity.toFixed(3)}`);

                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = candidate;
                }
            } else {
                // Candidate without embedding gets default score
                if (bestSimilarity < 0.5) {
                    bestMatch = candidate;
                    bestSimilarity = 0.5;
                }
            }
        }

        if (bestMatch) {
            this.logger.log(`✅ AI MATCH FOUND: User ${userId} matched with ${bestMatch.userId} (similarity: ${bestSimilarity.toFixed(3)})`);
            return bestMatch;
        }

        this.logger.debug(`❌ NO MATCH FOUND for user ${userId}`);
        return null;
    }

    /**
     * Fallback simple matching when embeddings not available
     */
    private findSimpleMatch(userId: string): QueueEntry | null {
        const currentUser = this.queue.get(userId);
        if (!currentUser) return null;

        for (const [candidateId, candidate] of this.queue.entries()) {
            if (candidateId === userId) continue;
            if (candidate.intentMode !== currentUser.intentMode) continue;

            const userPref = currentUser.genderPreference;
            const candidatePref = candidate.genderPreference;

            if (userPref === 'all' && candidatePref === 'all') {
                return candidate;
            }
        }
        return null;
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            this.logger.error('Vector dimension mismatch');
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    async createSession(user1Id: string, user2Id: string, intentMode: string): Promise<VideoSession> {
        const em = this.em.fork();
        const session = new VideoSession();
        session.user1Id = user1Id;
        session.user2Id = user2Id;
        session.intentMode = intentMode;
        session.status = 'active';
        await em.persistAndFlush(session);
        return session;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🎬 AI DATING HOST: Blind Session Management
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Initialize a blind date session with AI host features
     */
    initBlindSession(
        sessionId: string,
        user1Id: string,
        user2Id: string,
        introMessage: string,
        initialTopic: string,
    ): ActiveBlindSession {
        const session: ActiveBlindSession = {
            sessionId,
            participants: [user1Id, user2Id],
            blurLevel: 20, // Start with high blur (20px)
            startTime: new Date(),
            topicHistory: [initialTopic],
            currentTopic: initialTopic,
            lastActivityTime: new Date(),
            introMessage,
            revealTriggered: false,
        };
        this.blindSessions.set(sessionId, session);
        this.logger.log(`Initialized blind session ${sessionId} with blur level ${session.blurLevel}`);
        return session;
    }

    /**
     * Get blind session state
     */
    getBlindSession(sessionId: string): ActiveBlindSession | undefined {
        return this.blindSessions.get(sessionId);
    }

    /**
     * Update blur level (decrease over time or based on engagement)
     * Returns new blur level
     */
    decreaseBlur(sessionId: string, amount: number = 3): number {
        const session = this.blindSessions.get(sessionId);
        if (session) {
            session.blurLevel = Math.max(0, session.blurLevel - amount);
            this.logger.log(`Session ${sessionId} blur decreased to ${session.blurLevel}`);

            // Check if fully revealed
            if (session.blurLevel === 0 && !session.revealTriggered) {
                session.revealTriggered = true;
                this.logger.log(`Session ${sessionId} FULLY REVEALED! 🎉`);
            }

            return session.blurLevel;
        }
        return 0;
    }

    /**
     * Add a new topic to session history
     */
    addTopic(sessionId: string, topic: string): void {
        const session = this.blindSessions.get(sessionId);
        if (session) {
            session.topicHistory.push(topic);
            session.currentTopic = topic;
            session.lastActivityTime = new Date();
        }
    }

    /**
     * Update activity timestamp (when users are talking)
     */
    updateActivity(sessionId: string): void {
        const session = this.blindSessions.get(sessionId);
        if (session) {
            session.lastActivityTime = new Date();
        }
    }

    /**
     * Check if session has been silent too long (>10 seconds)
     */
    isSessionSilent(sessionId: string, thresholdMs: number = 10000): boolean {
        const session = this.blindSessions.get(sessionId);
        if (!session) return false;

        const silenceDuration = Date.now() - session.lastActivityTime.getTime();
        return silenceDuration > thresholdMs;
    }

    /**
     * Get session duration in seconds
     */
    getSessionDuration(sessionId: string): number {
        const session = this.blindSessions.get(sessionId);
        if (!session) return 0;
        return Math.floor((Date.now() - session.startTime.getTime()) / 1000);
    }

    /**
     * Cleanup blind session
     */
    cleanupBlindSession(sessionId: string): void {
        this.blindSessions.delete(sessionId);
        this.logger.log(`Cleaned up blind session ${sessionId}`);
    }

    /**
     * Get all active blind sessions (for the game loop)
     */
    getActiveBlindSessions(): Map<string, ActiveBlindSession> {
        return this.blindSessions;
    }

    async endSession(sessionId: string): Promise<void> {
        const em = this.em.fork();
        const sessionRepo = em.getRepository(VideoSession);
        const session = await sessionRepo.findOne({ id: sessionId });
        if (session) {
            session.status = 'ended';
            session.endedAt = new Date();
            if (session.startedAt) {
                session.durationSeconds = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
            }
            await em.persistAndFlush(session);
        }
        // Also cleanup blind session state
        this.cleanupBlindSession(sessionId);
    }

    async reportSession(sessionId: string): Promise<void> {
        await this.sessionRepo.nativeUpdate({ id: sessionId }, { status: 'reported' });
    }

    getQueueSize(): number {
        return this.queue.size;
    }
}
