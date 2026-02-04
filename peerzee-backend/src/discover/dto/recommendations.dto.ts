import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface DiscoverUserDto {
    id: string;
    display_name: string;
    bio?: string;
    location?: string;
    age?: number;
    occupation?: string;
    education?: string;
    photos: any[];
    prompts: any[];
    tags: string[];
    spotify?: { song: string; artist: string };
    instagram?: string;
    intentMode?: string;
    profileProperties?: any;
    distance_km?: number;
    matchScore?: number;
    matchReason?: string;
}

export class PaginatedRecommendationsDto {
    @ApiProperty({ type: [Object] })
    data: DiscoverUserDto[];

    @ApiPropertyOptional()
    nextCursor: string | null;

    @ApiProperty()
    hasMore: boolean;
}
