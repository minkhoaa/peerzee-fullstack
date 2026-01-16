import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';

@Entity('social_comments')
export class SocialComment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ name: 'author_id', type: 'uuid' })
    author_id: string;

    @Column({ name: 'post_id', type: 'uuid' })
    post_id: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'author_id' })
    author: User;

    @ManyToOne(() => SocialPost, (post) => post.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'post_id' })
    post: SocialPost;
}
