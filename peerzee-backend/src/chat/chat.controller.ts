import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';


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
}
