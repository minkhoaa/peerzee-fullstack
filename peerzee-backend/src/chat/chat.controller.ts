import { Controller, Get, Post, Param, UseGuards, Query, Req, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { AuthGuard } from '../user/guards/auth.guard';

// Simple in-memory rate limiter for AI suggestions
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 10000; // 10 seconds between requests

@ApiTags('chat')
@Controller('chat')
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly aiService: AiService,
    ) { }

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

    @Post('suggest-reply')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get AI-powered reply suggestions based on chat history and partner profile' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                conversationId: { type: 'string', description: 'The conversation ID' },
            },
            required: ['conversationId'],
        },
    })
    @ApiResponse({
        status: 200,
        schema: {
            type: 'object',
            properties: {
                suggestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '3 contextual reply suggestions',
                },
            },
        },
    })
    async suggestReply(
        @Body() body: { conversationId: string },
        @Req() req: { user: { sub: string } },
    ) {
        const userId = req.user.sub;
        const { conversationId } = body;

        if (!conversationId) {
            throw new BadRequestException('conversationId is required');
        }

        // Rate limiting check
        const lastRequest = rateLimitMap.get(userId);
        const now = Date.now();
        if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
            const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
            throw new BadRequestException(`Vui lòng đợi ${waitTime} giây trước khi gọi lại`);
        }
        rateLimitMap.set(userId, now);

        // Verify user is participant
        const isParticipant = await this.chatService.isParticipants(userId, conversationId);
        if (!isParticipant) {
            throw new BadRequestException('You are not a participant of this conversation');
        }

        // Get conversation context
        const context = await this.chatService.getConversationContext(conversationId, userId, 10);

        // Generate suggestions
        const suggestions = await this.aiService.generateReplySuggestions(
            context.chatHistory,
            context.partnerProfile,
            userId,
        );

        return { suggestions };
    }
}
