import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from './user-profile.entity';
import { UserSession } from './user-session.entity';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ select: false })
  password_hash: string;

  @ApiProperty()
  @Column({ default: 'active' })
  status: string;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  last_active_at: Date;

  // Safety: Incognito mode - hide from discovery except mutual likes
  @ApiProperty({ description: 'Incognito mode - hidden from discovery' })
  @Column({ name: 'is_incognito', type: 'boolean', default: false })
  isIncognito: boolean;

  // Safety: Blocked user IDs
  @ApiProperty({ description: 'List of blocked user IDs' })
  @Column({ name: 'blocked_user_ids', type: 'jsonb', default: '[]' })
  blockedUserIds: string[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

