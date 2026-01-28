import { Entity, ManyToOne } from '@mikro-orm/core';
import { Conversation } from './conversation.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ tableName: 'participants' })
export class Participant {
  @ManyToOne(() => Conversation, { primary: true, fieldName: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, { primary: true, fieldName: 'user_id' })
  user: User;
}
