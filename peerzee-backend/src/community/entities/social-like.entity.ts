import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';

@Entity('social_likes')
@Unique(['user_id', 'post_id']) // Ensure a user can only like a post once
export class SocialLike {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    user_id: string;

    @Column({ name: 'post_id', type: 'uuid' })
    post_id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => SocialPost, (post) => post.likes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: SocialPost;
}
