import {
    Entity,
    PrimaryKey,
    Property,
    ManyToOne,
    Index,
} from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { Conversation } from '../../chat/entities/conversation.entity';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'matches' })
@Index({ properties: ['user1', 'user2'], options: { unique: true } }) // Prevent duplicate matches
export class Match {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => User, { fieldName: 'user1_id' })
    user1: User;

    @ManyToOne(() => User, { fieldName: 'user2_id' })
    user2: User;

    @ManyToOne(() => Conversation, { fieldName: 'conversation_id' })
    conversation: Conversation;

    @Property({ fieldName: 'created_at', onCreate: () => new Date() })
    created_at: Date = new Date();
}
