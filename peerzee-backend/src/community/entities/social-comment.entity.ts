import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'social_comments' })
export class SocialComment {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ type: 'text' })
    content: string;

    @ManyToOne(() => User, { fieldName: 'author_id' })
    author: User;

    @ManyToOne(() => SocialPost, { fieldName: 'post_id' })
    post: SocialPost;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    createdAt: Date = new Date();
}
