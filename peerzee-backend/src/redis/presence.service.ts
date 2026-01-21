import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

// Redis key prefixes
const USER_STATUS_KEY = (userId: string) => `user:${userId}:status`;
const MATCHING_POOL_KEY = 'matching_pool';

export type UserStatus = 'ONLINE' | 'BUSY' | 'MATCHING';

@Injectable()
export class PresenceService {
    constructor(
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) { }

    /**
     * Set user online when they connect via socket
     */
    async setOnline(userId: string): Promise<void> {
        await this.redis.set(USER_STATUS_KEY(userId), 'ONLINE');
        // Set expiry of 24 hours as safety net
        await this.redis.expire(USER_STATUS_KEY(userId), 86400);
    }

    /**
     * Set user offline and clean up when they disconnect
     */
    async setOffline(userId: string): Promise<void> {
        await this.redis.del(USER_STATUS_KEY(userId));
        await this.redis.srem(MATCHING_POOL_KEY, userId);
    }

    /**
     * Get user's current status
     */
    async getStatus(userId: string): Promise<UserStatus | null> {
        const status = await this.redis.get(USER_STATUS_KEY(userId));
        return status as UserStatus | null;
    }

    /**
     * Add user to matching pool ("Tìm ngay")
     */
    async joinMatchingPool(userId: string): Promise<void> {
        await this.redis.set(USER_STATUS_KEY(userId), 'MATCHING');
        await this.redis.sadd(MATCHING_POOL_KEY, userId);
    }

    /**
     * Remove user from matching pool
     */
    async leaveMatchingPool(userId: string): Promise<void> {
        await this.redis.srem(MATCHING_POOL_KEY, userId);
        // Reset to ONLINE if still connected
        const exists = await this.redis.exists(USER_STATUS_KEY(userId));
        if (exists) {
            await this.redis.set(USER_STATUS_KEY(userId), 'ONLINE');
        }
    }

    /**
     * Get all users in matching pool
     */
    async getMatchingPoolUsers(): Promise<string[]> {
        return this.redis.smembers(MATCHING_POOL_KEY);
    }

    /**
     * Get count of users in matching pool
     */
    async getMatchingPoolCount(): Promise<number> {
        return this.redis.scard(MATCHING_POOL_KEY);
    }

    /**
     * Check if user is in matching pool
     */
    async isInMatchingPool(userId: string): Promise<boolean> {
        return (await this.redis.sismember(MATCHING_POOL_KEY, userId)) === 1;
    }

    /**
     * Get all online users count
     */
    async getOnlineCount(): Promise<number> {
        const keys = await this.redis.keys('user:*:status');
        return keys.length;
    }
}
