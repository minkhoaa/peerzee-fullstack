import {
    Entity,
    PrimaryKey,
    Property,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'ice_breakers' })
export class IceBreaker {
    @PrimaryKey({ type: 'uuid' })
    id: string = uuid();

    @Property({ type: 'text' })
    prompt: string;

    @Property({ default: 'general' })
    category: string = 'general'; // 'general' | 'fun' | 'deep' | 'flirty'

    @Property({ default: true })
    isActive: boolean = true;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();
}
