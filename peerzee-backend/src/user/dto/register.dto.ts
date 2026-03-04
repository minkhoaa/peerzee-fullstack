import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { UserGender } from "../entities/user-profile.entity";

/** @deprecated Use UserGender from the entity directly */
export { UserGender as UserGenderDto };

export class RegisterDto {
    @IsEmail()
    email: string;
    @IsOptional()
    @IsString()
    phone?: string;
    @IsString()
    password: string;
    @IsString()
    location: string;
    @IsString()
    display_name: string;
    @IsString()
    bio: string;
    @IsOptional()
    @IsEnum(UserGender)
    gender?: UserGender;
}

