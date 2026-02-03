import {
  Entity,
  PrimaryKey,
  Property,
  OneToOne,
  OneToMany,
} from '@mikro-orm/core';
import { v4 as uuid } from 'uuid';

import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from './user-profile.entity';
import { UserSession } from './user-session.entity';

@Entity({ tableName: 'users' })
export class User {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ApiProperty()
  @Property({ unique: true })
  email: string;

  @ApiProperty()
  @Property({ unique: true, nullable: true })
  phone: string | null;

  @Property({ hidden: true })
  password_hash: string;

  @ApiProperty()
  @Property({ default: 'active' })
  status: string = 'active';

  @ApiProperty()
  @Property({ type: 'timestamp', nullable: true })
  last_active_at: Date;

  // Safety: Incognito mode - hide from discovery except mutual likes
  @ApiProperty({ description: 'Incognito mode - hidden from discovery' })
  @Property({ fieldName: 'is_incognito', type: 'boolean', default: false })
  isIncognito: boolean = false;

  // Safety: Blocked user IDs
  @ApiProperty({ description: 'List of blocked user IDs' })
  @Property({ fieldName: 'blocked_user_ids', type: 'jsonb' })
  blockedUserIds: string[] = [];

  @OneToOne(() => UserProfile, (profile) => profile.user, { mappedBy: 'user' })
  profile: UserProfile;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @Property({ onCreate: () => new Date() })
  created_at: Date = new Date();

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
