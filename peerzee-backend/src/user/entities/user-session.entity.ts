import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
} from '@mikro-orm/core';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'user_sessions' })
export class UserSession {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @Property()
  refresh_token_hash: string;

  @Property()
  device_hash: string;

  @ManyToOne(() => User)
  user: User;

  @Property({ fieldName: 'user_id' })
  user_id: string;

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();
}
