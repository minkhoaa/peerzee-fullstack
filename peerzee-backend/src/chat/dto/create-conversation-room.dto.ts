import { IsArray, IsString, IsUUID } from 'class-validator';

export class CreateConversationRoomDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsArray()
  @IsUUID('all', { each: true })
  participantUserIds: string[];
}
