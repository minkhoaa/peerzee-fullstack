import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    Enum,
    Unique,
    Index,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

export enum SwipeAction {
    LIKE = 'LIKE',
    PASS = 'PASS',
    SUPER_LIKE = 'SUPER_LIKE',
}

@Entity({ tableName: 'user_swipes' })
@Unique({ properties: ['swiper', 'target'] }) // Prevent duplicate swipes
@Index({ properties: ['swiper', 'action'] }) // For efficient recommendation queries
@Index({ properties: ['target', 'action'] }) // For checking mutual likes
export class UserSwipe {
    @ApiProperty()
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'swiper_id' })
    swiper: User;

    @ManyToOne(() => User, { fieldName: 'target_id' })
    target: User;

    @ApiProperty({ enum: SwipeAction })
    @Enum(() => SwipeAction)
    action: SwipeAction;

    // Comment-First Matching: Message sent with the Like
    @ApiProperty({ description: 'Optional message sent with the like (Hinge-style)' })
    @Property({ type: 'text', nullable: true })
    message: string | null;

    // The specific content ID that was liked (photo ID, prompt ID, etc.)
    @ApiProperty({ description: 'ID of the specific content that was liked' })
    @Property({ type: 'varchar', length: 255, nullable: true })
    liked_content_id: string | null;

    // Type of content that was liked (photo, prompt, vibe)
    @ApiProperty({ description: 'Type of content liked: photo, prompt, vibe' })
    @Property({ type: 'varchar', length: 50, nullable: true })
    liked_content_type: string | null;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    created_at: Date = new Date();
}
