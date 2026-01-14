import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Message } from './message.entity';

@Entity('message_reactions')
export class MessageReaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'message_id' })
    message_id: string;

    @Column({ name: 'user_id' })
    user_id: string;

    @Column()
    emoji: string;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @CreateDateColumn()
    created_at: Date;
}