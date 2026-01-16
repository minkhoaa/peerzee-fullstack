import { IsInt, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteDto {
    @ApiProperty({
        description: 'Vote value: 1 (Upvote), -1 (Downvote), 0 (Remove vote)',
        enum: [1, -1, 0],
        example: 1,
    })
    @IsInt()
    @IsIn([1, -1, 0])
    value: number;
}
