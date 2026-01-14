import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Participant } from './participants.entity';
import { Message } from './message.entity';

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

  @OneToMany(() => Participant, (p) => p.conversation)
  participants: Participant[];

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];
}
