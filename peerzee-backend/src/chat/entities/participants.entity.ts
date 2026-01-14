import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
@Entity('participants')
export class Participant {
  @PrimaryColumn({ name: 'conversation_id', type: 'uuid' })
  conversation_id: string;
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Conversation, (k) => k.participants)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;
}

