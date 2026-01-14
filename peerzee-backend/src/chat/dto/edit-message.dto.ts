import { IsNotEmpty, IsString } from "class-validator";

export class EditMessageDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;
    @IsString()
    @IsNotEmpty()
    message_id: string;
    @IsString()
    @IsNotEmpty()
    body: string;
}
export class DeleteMessageDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;
    @IsString()
    @IsNotEmpty()
    message_id: string;
}