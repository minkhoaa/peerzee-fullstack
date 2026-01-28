import {
    Entity,
    PrimaryKey,
    Property,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'video_sessions' })
export class VideoSession {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ fieldName: 'user1_id' })
    user1Id: string;

    @Property({ fieldName: 'user2_id' })
    user2Id: string;

    @Property({ type: 'varchar', default: 'DATE' })
    intentMode: string = 'DATE'; // 'DATE' | 'STUDY' | 'FRIEND'

    @Property({ fieldName: 'started_at', onCreate: () => new Date() })
    startedAt: Date = new Date();

    @Property({ type: 'timestamp', nullable: true, fieldName: 'ended_at' })
    endedAt: Date | null;

    @Property({ default: 'active' })
    status: string = 'active'; // 'active' | 'ended' | 'reported'

    @Property({ type: 'int', default: 0, fieldName: 'duration_seconds' })
    durationSeconds: number = 0;
}
