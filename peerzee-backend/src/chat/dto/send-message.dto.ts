import {
  IsString,
  IsUUID,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  conversation_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  body: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsUUID()
  reply_to_id?: string;
}
