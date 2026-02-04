import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SwipeDto {
    @ApiProperty({ description: 'Target user ID to swipe on' })
    @IsUUID()
    targetId: string;

    @ApiProperty({ enum: ['LIKE', 'PASS', 'SUPER_LIKE'], description: 'Swipe action' })
    @IsEnum(['LIKE', 'PASS', 'SUPER_LIKE'])
    action: 'LIKE' | 'PASS' | 'SUPER_LIKE';

    @ApiPropertyOptional({ description: 'Message to send with the like' })
    @IsString()
    @IsOptional()
    message?: string;

    @ApiPropertyOptional({ description: 'ID of the specific content that was liked' })
    @IsString()
    @IsOptional()
    likedContentId?: string;

    @ApiPropertyOptional({ enum: ['photo', 'prompt', 'vibe'], description: 'Type of content liked' })
    @IsEnum(['photo', 'prompt', 'vibe'])
    @IsOptional()
    likedContentType?: 'photo' | 'prompt' | 'vibe';
}
