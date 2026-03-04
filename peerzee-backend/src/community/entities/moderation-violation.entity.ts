import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from '../../user/entities/user.entity';

export enum ViolationType {
    BLACKLIST = 'BLACKLIST',
    AI_DETECTED = 'AI_DETECTED',
}

export enum ContentType {
    POST = 'POST',
    COMMENT = 'COMMENT',
}

@Entity({ tableName: 'moderation_violations' })
export class ModerationViolation {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user_id' })
    user: User;

    @Enum(() => ViolationType)
    violationType: ViolationType;

    @Enum(() => ContentType)
    contentType: ContentType;

    // Snippet of the offending content (truncated for log)
    @Property({ type: 'varchar', length: 500 })
    contentSnippet: string;

    // Human-readable reason from AI or blacklist
    @Property({ type: 'text', nullable: true })
    reason?: string;

    // How many reputation points were deducted
    @Property({ type: 'int', default: 10 })
    reputationDeducted: number = 10;

    @Property({ fieldName: 'created_at', type: 'timestamptz', onCreate: () => new Date() })
    createdAt: Date = new Date();
}