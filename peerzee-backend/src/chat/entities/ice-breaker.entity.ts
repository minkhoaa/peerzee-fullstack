import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('ice_breakers')
export class IceBreaker {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    prompt: string;

    @Column({ default: 'general' })
    category: string; // 'general' | 'fun' | 'deep' | 'flirty'

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
