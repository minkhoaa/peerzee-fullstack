import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Photo and Prompt types for rich profile
export class ProfilePhotoDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    url: string;

    @ApiPropertyOptional()
    isCover?: boolean;

    @ApiPropertyOptional()
    order?: number;
}

export class ProfilePromptDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    question: string;

    @ApiProperty()
    answer: string;

    @ApiPropertyOptional()
    emoji?: string;
}

export class SwipeResponseDto {
    @ApiProperty({ description: 'Whether a mutual match occurred' })
    isMatch: boolean;

    @ApiProperty({ description: 'Matched user info (if match)', required: false })
    matchedUser?: {
        id: string;
        display_name: string;
    };

    @ApiProperty({ description: 'Conversation ID for chatting (if match)', required: false })
    conversationId?: string;
}

export class RecommendationUserDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    email: string;

    @ApiPropertyOptional()
    display_name?: string;

    @ApiPropertyOptional()
    bio?: string;

    @ApiPropertyOptional()
    location?: string;

    // Rich Profile Fields
    @ApiPropertyOptional({ description: 'Age of the user' })
    age?: number;

    @ApiPropertyOptional({ description: 'Occupation/Job title' })
    occupation?: string;

    @ApiPropertyOptional({ description: 'Education/School' })
    education?: string;

    @ApiPropertyOptional({ type: [ProfilePhotoDto], description: 'Array of profile photos' })
    photos?: ProfilePhotoDto[];

    @ApiPropertyOptional({ type: [ProfilePromptDto], description: 'Array of prompt responses' })
    prompts?: ProfilePromptDto[];

    @ApiPropertyOptional({ type: [String], description: 'Array of interest tags' })
    tags?: string[];

    @ApiPropertyOptional({ description: 'Spotify anthem' })
    spotify?: { song: string; artist: string };

    @ApiPropertyOptional({ description: 'Instagram handle' })
    instagram?: string;

    @ApiPropertyOptional({ description: 'Calculated compatibility percentage' })
    compatibilityScore?: number;
}
