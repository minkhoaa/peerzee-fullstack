import { IsArray, IsString } from 'class-validator';
import { TagDto } from './tag.dto';

export class AddTagDto {
  @IsString()
  user_id: string;
  @IsArray()
  tags: TagDto[];
}
