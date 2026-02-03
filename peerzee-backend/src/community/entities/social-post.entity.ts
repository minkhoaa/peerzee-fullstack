import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    OneToMany,
    JsonType,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { SocialComment } from './social-comment.entity';
import { SocialLike } from './social-like.entity';
import { SocialVote } from './social-vote.entity';
import { v4 as uuid } from 'uuid';

// Media item interface for the JSONB column
export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    width?: number;
    height?: number;
    publicId?: string; // Cloudinary public ID for management
    thumbnail?: string; // Video thumbnail URL
}

@Entity({ tableName: 'social_posts' })
export class SocialPost {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ type: 'text' })
    content: string;

    // Renamed from 'images' to 'media' to support both images and videos
    @Property({ type: JsonType })
    media?: MediaItem[];

    @Property({ type: JsonType })
    tags?: string[];

    @ManyToOne(() => User, { fieldName: 'author_id' })
    author: User;

    /**
     * Reddit-style score = Upvotes - Downvotes
     */
    @Property({ type: 'int', default: 0 })
    score: number = 0;

    @Property({ fieldName: 'likes_count', type: 'int', default: 0 })
    likesCount: number = 0;

    @Property({ fieldName: 'comments_count', type: 'int', default: 0 })
    commentsCount: number = 0;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date = new Date();

    @OneToMany(() => SocialComment, (comment) => comment.post)
    comments: SocialComment[];

    @OneToMany(() => SocialLike, (like) => like.post)
    likes: SocialLike[];

    @OneToMany(() => SocialVote, (vote) => vote.post)
    votes: SocialVote[];
}
