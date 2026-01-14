import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_tags')
export class UserTag {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  tag_type: string;

  @ApiProperty()
  @Column({ nullable: true })
  tag_name: string;
}
