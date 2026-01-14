import { IsString } from 'class-validator';

export class UpdateUserProfileDto {
  @IsString()
  display_name: string;
  @IsString()
  bio: string;
  @IsString()
  location: string;
}
