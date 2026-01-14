import { IsString } from 'class-validator';

export class TagDto {
  @IsString()
  tag_type: string;
  @IsString()
  tag_value: string;
}
