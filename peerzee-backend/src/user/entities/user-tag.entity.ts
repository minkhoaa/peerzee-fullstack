import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuid } from 'uuid';

@Entity({ tableName: 'user_tags' })
export class UserTag {
  @ApiProperty()
  @PrimaryKey({ type: 'uuid' })
  id: string = uuid();

  @ApiProperty()
  @Property({ unique: true })
  tag_type: string;

  @ApiProperty()
  @Property({ nullable: true })
  tag_name: string;
}
