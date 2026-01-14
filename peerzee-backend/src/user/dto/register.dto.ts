import { IsEmail, IsString } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;
    @IsString()
    phone: string;
    @IsString()
    password: string;
    @IsString()
    location: string;
    @IsString()
    display_name: string;
    @IsString()
    bio: string;
}
