import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PresenceService } from './presence.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: () => {
                const redis = new Redis({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    maxRetriesPerRequest: 3,
                });

                redis.on('connect', () => {
                    console.log('✅ Redis connected');
                });

                redis.on('error', (err) => {
                    console.error('❌ Redis error:', err);
                });

                return redis;
            },
        },
        PresenceService,
    ],
    exports: [REDIS_CLIENT, PresenceService],
})
export class RedisModule { }

