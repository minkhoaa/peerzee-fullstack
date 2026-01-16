import { IsOptional, IsUUID, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetFeedDto {
    @ApiPropertyOptional({ description: 'Number of posts to fetch', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Cursor for pagination (post ID to fetch before)' })
    @IsOptional()
    @IsUUID()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Filter by tag (e.g., #Programming)' })
    @IsOptional()
    @IsString()
    tag?: string;

    @ApiPropertyOptional({
        description: 'Sort order: new (newest first) or top (highest score first)',
        enum: ['new', 'top'],
        default: 'new'
    })
    @IsOptional()
    @IsIn(['new', 'top'])
    sort?: 'new' | 'top' = 'new';
}
