import { Controller, Get, Post, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AuthGuard } from '../user/guards/auth.guard';


@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('ice-breakers')
    @ApiOperation({ summary: 'Get random ice breaker prompts' })
    @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of prompts to return (default: 3)' })
    async getIceBreakers(@Query('count') count: string = '3') {
        const numCount = parseInt(count, 10) || 3;
        return this.chatService.getRandomIceBreakers(numCount);
    }

    @Post('dm/:targetUserId')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Start or get existing DM conversation with a user' })
    async startDM(
        @Param('targetUserId') targetUserId: string,
        @Req() req: { user: { sub: string } },
    ) {
        const userId = req.user.sub;
        const conversation = await this.chatService.findOrCreateDMConversation(userId, targetUserId);
        return {
            conversationId: conversation.id,
            isDirect: conversation.isDirect,
            isNew: !conversation.lastMessageAt,
        };
    }
}
