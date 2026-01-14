import { IsNotEmpty, IsString } from 'class-validator';

export class TypingDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;
}
