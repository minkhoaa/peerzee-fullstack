import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum SwipeAction {
    LIKE = 'LIKE',
    PASS = 'PASS',
    SUPER_LIKE = 'SUPER_LIKE',
}

@Entity('user_swipes')
@Unique(['swiper_id', 'target_id']) // Prevent duplicate swipes
@Index(['swiper_id', 'action']) // For efficient recommendation queries
@Index(['target_id', 'action']) // For checking mutual likes
export class UserSwipe {
    @ApiProperty()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty()
    @Column({ name: 'swiper_id', type: 'uuid' })
    swiper_id: string;

    @ApiProperty()
    @Column({ name: 'target_id', type: 'uuid' })
    target_id: string;

    @ApiProperty({ enum: SwipeAction })
    @Column({
        type: 'enum',
        enum: SwipeAction,
    })
    action: SwipeAction;

    // Comment-First Matching: Message sent with the Like
    @ApiProperty({ description: 'Optional message sent with the like (Hinge-style)' })
    @Column({ type: 'text', nullable: true })
    message: string | null;

    // The specific content ID that was liked (photo ID, prompt ID, etc.)
    @ApiProperty({ description: 'ID of the specific content that was liked' })
    @Column({ type: 'varchar', length: 255, nullable: true })
    liked_content_id: string | null;

    // Type of content that was liked (photo, prompt, vibe)
    @ApiProperty({ description: 'Type of content liked: photo, prompt, vibe' })
    @Column({ type: 'varchar', length: 50, nullable: true })
    liked_content_type: string | null;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'swiper_id' })
    swiper: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'target_id' })
    target: User;
}
