import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { Message } from './message.entity';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'message_reactions' })
export class MessageReaction {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @ManyToOne(() => Message, { fieldName: 'message_id' })
    message: Message;

    @Property({ fieldName: 'user_id' })
    user_id: string;

    @Property()
    emoji: string;

    @Property({ onCreate: () => new Date() })
    created_at: Date = new Date();
}