import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsNumber,
    IsArray,
    ValidateNested,
    IsIn,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================================
// Profile Photo DTO
// ============================================================================

export class ProfilePhotoDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    url: string;

    @ApiPropertyOptional()
    @IsOptional()
    isCover?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    order?: number;
}

// ============================================================================
// Profile Prompt DTO
// ============================================================================

export class ProfilePromptDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsString()
    answer: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    emoji?: string;
}

// ============================================================================
// Discovery Settings DTO
// ============================================================================

export class DiscoverySettingsDto {
    @ApiPropertyOptional({ minimum: 18, maximum: 100 })
    @IsOptional()
    @IsNumber()
    @Min(18)
    @Max(100)
    minAge?: number;

    @ApiPropertyOptional({ minimum: 18, maximum: 100 })
    @IsOptional()
    @IsNumber()
    @Min(18)
    @Max(100)
    maxAge?: number;

    @ApiPropertyOptional({ minimum: 1, maximum: 500 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(500)
    maxDistance?: number;

    @ApiPropertyOptional({ enum: ['male', 'female', 'all'] })
    @IsOptional()
    @IsIn(['male', 'female', 'all'])
    genderPreference?: 'male' | 'female' | 'all';
}

// ============================================================================
// Update Profile DTO
// ============================================================================

export class UpdateProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(18)
    @Max(100)
    age?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    occupation?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    education?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({ type: [ProfilePhotoDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProfilePhotoDto)
    photos?: ProfilePhotoDto[];

    @ApiPropertyOptional({ type: [ProfilePromptDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProfilePromptDto)
    prompts?: ProfilePromptDto[];

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @ApiPropertyOptional({ type: DiscoverySettingsDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DiscoverySettingsDto)
    discovery_settings?: DiscoverySettingsDto;

    @ApiPropertyOptional()
    @IsOptional()
    spotify?: { song: string; artist: string };

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    instagram?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    longitude?: number;
}

// ============================================================================
// Photo Reorder DTO
// ============================================================================

export class ReorderPhotosDto {
    @ApiProperty({ type: [String], description: 'Array of photo IDs in new order' })
    @IsArray()
    @IsString({ each: true })
    photoIds: string[];
}

// ============================================================================
// Add Photo DTO
// ============================================================================

export class AddPhotoDto {
    @ApiProperty()
    @IsString()
    url: string;

    @ApiPropertyOptional()
    @IsOptional()
    isCover?: boolean;
}

// ============================================================================
// Response DTOs
// ============================================================================

export class ProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty()
    display_name: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    age?: number;

    @ApiPropertyOptional()
    occupation?: string;

    @ApiPropertyOptional()
    education?: string;

    @ApiPropertyOptional()
    location?: string;

    @ApiProperty({ type: [ProfilePhotoDto] })
    photos: ProfilePhotoDto[];

    @ApiProperty({ type: [ProfilePromptDto] })
    prompts: ProfilePromptDto[];

    @ApiProperty({ type: [String] })
    tags: string[];

    @ApiPropertyOptional()
    spotify?: { song: string; artist: string };

    @ApiPropertyOptional()
    instagram?: string;

    @ApiPropertyOptional({ type: DiscoverySettingsDto })
    discovery_settings?: DiscoverySettingsDto;
}
