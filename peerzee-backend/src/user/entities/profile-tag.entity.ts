import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('profile_tags')
export class ProfileTag {
  @ApiProperty()
  @PrimaryColumn()
  user_id: string;

  @ApiProperty()
  @PrimaryColumn()
  tag_type: string;

  @ApiProperty()
  @PrimaryColumn()
  tag_value: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
