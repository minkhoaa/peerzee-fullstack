import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('video_sessions')
export class VideoSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user1_id' })
    user1Id: string;

    @Column({ name: 'user2_id' })
    user2Id: string;

    @Column({ type: 'varchar', default: 'DATE' })
    intentMode: string; // 'DATE' | 'STUDY' | 'FRIEND'

    @CreateDateColumn({ name: 'started_at' })
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true, name: 'ended_at' })
    endedAt: Date | null;

    @Column({ default: 'active' })
    status: string; // 'active' | 'ended' | 'reported'

    @Column({ type: 'int', default: 0, name: 'duration_seconds' })
    durationSeconds: number;
}
