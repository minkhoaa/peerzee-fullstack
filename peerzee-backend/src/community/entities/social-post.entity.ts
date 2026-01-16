import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SocialComment } from './social-comment.entity';
import { SocialLike } from './social-like.entity';
import { SocialVote } from './social-vote.entity';

// Media item interface for the JSONB column
export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    publicId?: string; // Cloudinary public ID for management
    thumbnail?: string; // Video thumbnail URL
}

@Entity('social_posts')
export class SocialPost {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    content: string;

    // Renamed from 'images' to 'media' to support both images and videos
    @Column({ type: 'jsonb', default: [] })
    media: MediaItem[];

    @Column({ type: 'jsonb', default: [] })
    tags: string[];

    @Column({ name: 'author_id', type: 'uuid' })
    author_id: string;

    /**
     * Reddit-style score = Upvotes - Downvotes
     */
    @Column({ type: 'int', default: 0 })
    score: number;

    @Column({ name: 'likes_count', type: 'int', default: 0 })
    likesCount: number;

    @Column({ name: 'comments_count', type: 'int', default: 0 })
    commentsCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'author_id' })
    author: User;

    @OneToMany(() => SocialComment, (comment) => comment.post)
    comments: SocialComment[];

    @OneToMany(() => SocialLike, (like) => like.post)
    likes: SocialLike[];

    @OneToMany(() => SocialVote, (vote) => vote.post)
    votes: SocialVote[];
}
