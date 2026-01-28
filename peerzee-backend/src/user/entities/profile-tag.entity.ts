import { Entity, PrimaryKey, ManyToOne } from '@mikro-orm/core';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ tableName: 'profile_tags' })
export class ProfileTag {
  @ApiProperty()
  @ManyToOne(() => User, { fieldName: 'user_id', primary: true })
  user: User;

  @ApiProperty()
  @PrimaryKey()
  tag_type: string;

  @ApiProperty()
  @PrimaryKey()
  tag_value: string;
}
