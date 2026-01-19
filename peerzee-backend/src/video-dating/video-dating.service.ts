import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoSession } from './entities/video-session.entity';

export interface QueueEntry {
    userId: string;
    socketId: string;
    intentMode: string;
    genderPreference: string;
    gender?: string;
    displayName?: string;
    joinedAt: Date;
}

@Injectable()
export class VideoDatingService {
    // In-memory queue (for simplicity, could use Redis in production)
    private queue: Map<string, QueueEntry> = new Map();

    constructor(
        @InjectRepository(VideoSession)
        private readonly sessionRepo: Repository<VideoSession>,
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
     * Find a compatible match for the given user
     * Match criteria:
     * - Same intentMode
     * - Compatible gender preferences (if both specify 'all' or match each other's criteria)
     * - Not the same user
     */
    findMatch(userId: string): QueueEntry | null {
        const currentUser = this.queue.get(userId);
        if (!currentUser) return null;

        for (const [candidateId, candidate] of this.queue.entries()) {
            if (candidateId === userId) continue;

            // Same intent mode
            if (candidate.intentMode !== currentUser.intentMode) continue;

            // Gender preference compatibility (simplified - 'all' matches everyone)
            const userPref = currentUser.genderPreference;
            const candidatePref = candidate.genderPreference;

            // Both have 'all' preference - match
            if (userPref === 'all' && candidatePref === 'all') {
                return candidate;
            }

            // Check if preferences match
            const userGender = currentUser.gender || 'unknown';
            const candidateGender = candidate.gender || 'unknown';

            const userWantsCandidate = userPref === 'all' || userPref === candidateGender;
            const candidateWantsUser = candidatePref === 'all' || candidatePref === userGender;

            if (userWantsCandidate && candidateWantsUser) {
                return candidate;
            }
        }

        return null;
    }

    async createSession(user1Id: string, user2Id: string, intentMode: string): Promise<VideoSession> {
        const session = this.sessionRepo.create({
            user1Id,
            user2Id,
            intentMode,
            status: 'active',
        });
        return this.sessionRepo.save(session);
    }

    async endSession(sessionId: string): Promise<void> {
        const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
        if (session) {
            session.status = 'ended';
            session.endedAt = new Date();
            if (session.startedAt) {
                session.durationSeconds = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
            }
            await this.sessionRepo.save(session);
        }
    }

    async reportSession(sessionId: string): Promise<void> {
        await this.sessionRepo.update(sessionId, { status: 'reported' });
    }

    getQueueSize(): number {
        return this.queue.size;
    }
}
