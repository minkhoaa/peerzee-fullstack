import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WingmanService } from './wingman.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { Request } from 'express';
import { WingmanMessage } from '../chat/entities/wingman-conversation.entity';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

// DTOs
class ChatDto {
  message: string;
  targetUserId?: string;
  chatContext?: string;
}

class SuggestReplyDto {
  messages: { sender: 'me' | 'them'; content: string }[];
  targetUserId?: string;
}

@Controller('wingman')
@UseGuards(AuthGuard)
export class WingmanController {
  constructor(private readonly wingmanService: WingmanService) {}

  /**
   * Chat with AI Wingman
   * POST /wingman/chat
   */
  @Post('chat')
  async chat(@Req() req: AuthenticatedRequest, @Body() dto: ChatDto) {
    const userId = req.user.sub;
    return this.wingmanService.chat(userId, dto.message, {
      targetUserId: dto.targetUserId,
      chatContext: dto.chatContext,
    });
  }

  /**
   * Get profile improvement tips
   * GET /wingman/profile-tips
   */
  @Get('profile-tips')
  async getProfileTips(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    return this.wingmanService.getProfileTips(userId);
  }

  /**
   * Get icebreaker suggestions for a specific match
   * GET /wingman/icebreakers/:targetUserId
   */
  @Get('icebreakers/:targetUserId')
  async getIcebreakers(
    @Req() req: AuthenticatedRequest,
    @Param('targetUserId') targetUserId: string,
  ) {
    const userId = req.user.sub;
    return this.wingmanService.getIcebreakers(userId, targetUserId);
  }

  /**
   * Suggest reply based on conversation context
   * POST /wingman/suggest-reply
   */
  @Post('suggest-reply')
  async suggestReply(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SuggestReplyDto,
  ) {
    const userId = req.user.sub;
    
    // Optionally get target profile if targetUserId provided
    let targetProfile;
    if (dto.targetUserId) {
      // The service will fetch this internally
    }

    return this.wingmanService.suggestReply(userId, dto.messages);
  }

  /**
   * Get conversation history with Wingman
   * GET /wingman/history
   */
  @Get('history')
  async getHistory(@Req() req: AuthenticatedRequest): Promise<{ messages: WingmanMessage[] }> {
    const userId = req.user.sub;
    const messages = await this.wingmanService.getHistory(userId);
    return { messages };
  }

  /**
   * Clear conversation history with Wingman
   * DELETE /wingman/history
   */
  @Delete('history')
  async clearHistory(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub;
    await this.wingmanService.clearHistory(userId);
    return { success: true };
  }
}
