import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    Unique,
    Index,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';
import { v4 as uuid } from 'uuid';

/**
 * SocialVote Entity - Reddit-style voting
 * value: 1 (Upvote), -1 (Downvote)
 * A user can only have one vote state per post
 */
@Entity({ tableName: 'social_votes' })
export class SocialVote {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user_id' })
    user: User;

    @ManyToOne(() => SocialPost, { fieldName: 'post_id' })
    post: SocialPost;

    /**
     * Vote value: 1 for Upvote, -1 for Downvote
     */
    @Property({ type: 'int' })
    value: number;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    createdAt: Date = new Date();
}
