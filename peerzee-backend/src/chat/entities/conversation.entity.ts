import { Entity, PrimaryKey, Property, OneToMany } from '@mikro-orm/core';
import { Participant } from './participants.entity';
import { Message } from './message.entity';
import { v4 as uuid } from 'uuid';

// Icebreaker interface for the JSONB column
export interface IcebreakerData {
  questionId: string;
  question: string;
  user1Id: string;
  user2Id: string;
  answerUser1?: string;
  answerUser2?: string;
  isUnlocked: boolean;
}

@Entity({ tableName: 'conversation' })
export class Conversation {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @Property({ type: 'text' })
  type: string;

  @Property({ type: 'text' })
  name: string;

  @Property({ fieldName: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Property({ type: 'text', fieldName: 'last_message', nullable: true })
  lastMessage: string | null;

  @Property({ fieldName: 'last_seq', type: 'bigint', default: '0' })
  lastSeq: string = '0';

  // Icebreaker game data
  @Property({ type: 'jsonb', nullable: true })
  icebreaker: IcebreakerData | null = null;

  // AI-generated contextual icebreaker suggestion
  @Property({ fieldName: 'icebreaker_suggestion', type: 'text', nullable: true })
  icebreakerSuggestion: string | null;

  // Flag to distinguish DM (1-1) from group conversations
  @Property({ fieldName: 'is_direct', type: 'boolean', default: true })
  isDirect: boolean = true;

  @OneToMany(() => Participant, (p) => p.conversation)
  participants: Participant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}
