import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  OneToMany,
} from '@mikro-orm/core';
import { Conversation } from './conversation.entity';
import { MessageReaction } from './message-reaction.entity';
import { v4 as uuid } from 'uuid';

// Voice analysis result type
interface VoiceAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  emotion: string; // happy, sad, excited, calm, etc.
  confidence: number;
}

@Entity({ tableName: 'message' })
export class Message {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ManyToOne(() => Conversation, { fieldName: 'conversation_id' })
  conversation: Conversation;

  @Property({ type: 'uuid', fieldName: 'sender_id' })
  sender_id: string;

  @Property({ type: 'text' })
  body: string;

  @Property({ type: 'bigint' })
  seq: string;

  @Property({ type: 'timestamptz', onCreate: () => new Date(), nullable: true, fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date(), nullable: true, fieldName: 'updated_at' })
  updatedAt: Date = new Date();

  @Property({ type: 'boolean', default: false })
  isEdited: boolean = false;

  @Property({ type: 'boolean', default: false })
  isDeleted: boolean = false;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Property({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Property({ type: 'varchar', nullable: true })
  fileUrl: string | null;

  @Property({ type: 'varchar', nullable: true })
  fileName: string | null;

  @Property({ type: 'varchar', nullable: true })
  fileType: string | null;

  // Voice note fields
  @Property({ type: 'int', nullable: true, fieldName: 'audio_duration' })
  audioDuration: number | null;

  @Property({ type: 'text', nullable: true })
  transcription: string | null;

  @Property({ type: 'jsonb', nullable: true, fieldName: 'voice_analysis' })
  voiceAnalysis: VoiceAnalysis | null;

  @OneToMany(() => MessageReaction, (r) => r.message)
  reactions: MessageReaction[];

  @ManyToOne(() => Message, { fieldName: 'reply_to_id', nullable: true })
  replyTo: Message | null;
}
