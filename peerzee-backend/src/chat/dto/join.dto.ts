import { IsString, IsUUID } from 'class-validator';

export class JoinDto {
  @IsUUID()
  conversation_id: string;
}
