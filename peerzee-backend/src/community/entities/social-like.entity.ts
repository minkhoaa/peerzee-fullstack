import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    Unique,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { SocialPost } from './social-post.entity';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'social_likes' })
export class SocialLike {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user_id' })
    user: User;

    @ManyToOne(() => SocialPost, { fieldName: 'post_id' })
    post: SocialPost;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    createdAt: Date = new Date();
}
