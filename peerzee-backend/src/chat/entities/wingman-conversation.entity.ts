import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { User } from '../../user/entities/user.entity';
import { v4 as uuid } from 'uuid';

// Message in wingman conversation
export interface WingmanMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Context for personalized responses
export interface WingmanContext {
  profileData?: {
    display_name?: string;
    bio?: string;
    tags?: string[];
    intentMode?: string;
  };
  matchData?: {
    targetUserId?: string;
    targetName?: string;
    commonTags?: string[];
  };
  conversationId?: string; // For suggesting replies
}

@Entity({ tableName: 'wingman_conversations' })
export class WingmanConversation {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ManyToOne(() => User, { fieldName: 'user_id' })
  @Index()
  user: User;

  @Property({ type: 'jsonb', default: [] })
  messages: WingmanMessage[] = [];

  @Property({ type: 'jsonb', nullable: true })
  context: WingmanContext | null = null;

  @Property({ type: 'timestamptz', onCreate: () => new Date(), fieldName: 'created_at' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamptz', onCreate: () => new Date(), onUpdate: () => new Date(), fieldName: 'updated_at' })
  updatedAt: Date = new Date();
}
