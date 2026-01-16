import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Conversation } from '../../chat/entities/conversation.entity';

@Entity('matches')
@Index(['user1_id', 'user2_id'], { unique: true }) // Prevent duplicate matches
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user1_id', type: 'uuid' })
    user1_id: string;

    @Column({ name: 'user2_id', type: 'uuid' })
    user2_id: string;

    @Column({ name: 'conversation_id', type: 'uuid' })
    conversation_id: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user1_id' })
    user1: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user2_id' })
    user2: User;

    @ManyToOne(() => Conversation)
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;
}
