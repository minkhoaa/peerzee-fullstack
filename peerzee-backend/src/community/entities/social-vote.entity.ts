import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
    Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';

/**
 * SocialVote Entity - Reddit-style voting
 * value: 1 (Upvote), -1 (Downvote)
 * A user can only have one vote state per post
 */
@Entity('social_votes')
@Unique(['user_id', 'post_id']) // Ensure one vote per user per post
@Index(['post_id']) // Fast lookup by post
@Index(['user_id']) // Fast lookup by user
export class SocialVote {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    user_id: string;

    @Column({ name: 'post_id', type: 'uuid' })
    post_id: string;

    /**
     * Vote value: 1 for Upvote, -1 for Downvote
     */
    @Column({ type: 'int' })
    value: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => SocialPost, (post) => post.votes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: SocialPost;
}
