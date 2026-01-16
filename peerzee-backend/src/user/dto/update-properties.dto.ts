import { IsOptional, IsEnum, IsObject, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ProfilePropertiesDto {
    @ApiPropertyOptional({ description: 'Zodiac sign (e.g., Aries, Leo)' })
    @IsOptional()
    @IsString()
    zodiac?: string;

    @ApiPropertyOptional({ description: 'MBTI type (e.g., INTJ, ENFP)' })
    @IsOptional()
    @IsString()
    mbti?: string;

    @ApiPropertyOptional({ description: 'Habits/Lifestyle (e.g., ["Early Bird", "Gym Rat"])' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    habits?: string[];

    @ApiPropertyOptional({ description: 'Height (e.g., "175cm")' })
    @IsOptional()
    @IsString()
    height?: string;

    @ApiPropertyOptional({ description: 'Languages spoken' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    languages?: string[];

    @ApiPropertyOptional({ description: 'What you are looking for' })
    @IsOptional()
    @IsString()
    lookingFor?: string;
}

export class UpdatePropertiesDto {
    @ApiPropertyOptional({
        description: 'Intent mode',
        enum: ['DATE', 'STUDY', 'FRIEND'],
        example: 'STUDY'
    })
    @IsOptional()
    @IsEnum(['DATE', 'STUDY', 'FRIEND'])
    intentMode?: 'DATE' | 'STUDY' | 'FRIEND';

    @ApiPropertyOptional({ description: 'Profile properties (zodiac, mbti, habits, etc.)' })
    @IsOptional()
    @IsObject()
    @Type(() => ProfilePropertiesDto)
    profileProperties?: ProfilePropertiesDto;
}
