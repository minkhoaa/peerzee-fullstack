import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';
import { User } from '../../user/entities/user.entity';

@Entity({ tableName: 'user_gamification' })
export class UserGamification {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @OneToOne(() => User, { owner: true, unique: true })
    user: User;

    @Property({ default: 0 })
    xp: number = 0;

    @Property({ default: 1 })
    level: number = 1;

    @Property({ type: 'jsonb', default: '[]' })
    badges: string[] = [];

    @Property({ type: 'timestamptz', nullable: true })
    lastActionAt: Date;

    @Property({ default: 0 })
    currentStreak: number = 0;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
