import { IsString, IsArray, IsOptional, MinLength, MaxLength, ValidateNested, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MediaItemDto {
    @ApiProperty({ description: 'Media URL' })
    @IsString()
    url: string;

    @ApiProperty({ description: 'Media type', enum: ['image', 'video'] })
    @IsIn(['image', 'video'])
    type: 'image' | 'video';

    @ApiPropertyOptional({ description: 'Filename on server' })
    @IsOptional()
    @IsString()
    filename?: string;

    @ApiPropertyOptional({ description: 'Original filename' })
    @IsOptional()
    @IsString()
    originalName?: string;

    @ApiPropertyOptional({ description: 'File size in bytes' })
    @IsOptional()
    size?: number;

    @ApiPropertyOptional({ description: 'Media width' })
    @IsOptional()
    width?: number;

    @ApiPropertyOptional({ description: 'Media height' })
    @IsOptional()
    height?: number;

    @ApiPropertyOptional({ description: 'Public ID for storage' })
    @IsOptional()
    @IsString()
    publicId?: string;

    @ApiPropertyOptional({ description: 'Video thumbnail URL' })
    @IsOptional()
    @IsString()
    thumbnail?: string;
}

export class CreatePostDto {
    @ApiProperty({ description: 'Post content (supports Markdown)' })
    @IsString()
    @MinLength(1)
    @MaxLength(5000)
    content: string;

    @ApiPropertyOptional({ description: 'Array of tags', example: ['#coding', '#help'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ description: 'Array of media items (images/videos)' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaItemDto)
    @IsOptional()
    media?: MediaItemDto[];
}
