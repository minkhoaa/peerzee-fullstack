import { IsEnum, IsUUID, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SwipeAction } from '../entities/user-swipe.entity';

export class CreateSwipeDto {
    @ApiProperty({ description: 'Target user ID to swipe on' })
    @IsUUID()
    targetId: string;

    @ApiProperty({ enum: SwipeAction, description: 'Swipe action: LIKE, PASS, or SUPER_LIKE' })
    @IsEnum(SwipeAction)
    action: SwipeAction;

    // Comment-First Matching: Optional message with Like
    @ApiPropertyOptional({ description: 'Message to send with the like (Hinge-style)' })
    @IsOptional()
    @IsString()
    message?: string;

    // The specific content ID that was liked
    @ApiPropertyOptional({ description: 'ID of the specific content that was liked (photo, prompt, etc.)' })
    @IsOptional()
    @IsString()
    likedContentId?: string;

    // Type of content that was liked
    @ApiPropertyOptional({
        description: 'Type of content liked',
        enum: ['photo', 'prompt', 'vibe']
    })
    @IsOptional()
    @IsIn(['photo', 'prompt', 'vibe'])
    likedContentType?: 'photo' | 'prompt' | 'vibe';
}
