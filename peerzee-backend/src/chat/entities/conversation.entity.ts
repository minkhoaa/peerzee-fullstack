import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Participant } from './participants.entity';
import { Message } from './message.entity';

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

@Entity('conversation')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'text', name: 'last_message', nullable: true })
  lastMessage: string | null;

  @Column({ name: 'last_seq', type: 'bigint', default: '0' })
  lastSeq: string;

  // Icebreaker game data
  @Column({ type: 'jsonb', nullable: true, default: null })
  icebreaker: IcebreakerData | null;

  // AI-generated contextual icebreaker suggestion
  @Column({ name: 'icebreaker_suggestion', type: 'text', nullable: true })
  icebreakerSuggestion: string | null;

  // Flag to distinguish DM (1-1) from group conversations
  @Column({ name: 'is_direct', type: 'boolean', default: true })
  isDirect: boolean;

  @OneToMany(() => Participant, (p) => p.conversation)
  participants: Participant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}

