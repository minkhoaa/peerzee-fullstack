import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export enum UserGenderDto {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER',
}

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
    @IsEnum(UserGenderDto)
    gender?: UserGenderDto;
}

