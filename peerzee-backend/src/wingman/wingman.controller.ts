import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WingmanService } from './wingman.service';
import { WingmanAgenticService } from './wingman-agentic.service';
import { PlacesService } from './places.service';
import { AuthGuard } from '../user/guards/auth.guard';
import { Request } from 'express';
import { WingmanMessage } from '../chat/entities/wingman-conversation.entity';

interface AuthenticatedRequest extends Request {
  user: { sub: string; email: string };
}

// DTOs
class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsString()
  chatContext?: string;

  @IsOptional()
  @IsBoolean()
  useAgentic?: boolean;
}

class ChatMessageDto {
  @IsString()
  sender: 'me' | 'them';

  @IsString()
  content: string;
}

class SuggestReplyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsString()
  targetUserId?: string;
}

class DateSpotsDto {
  @IsString()
  matchUserId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];
}

@Controller('wingman')
@UseGuards(AuthGuard)
export class WingmanController {
  private readonly logger = new Logger(WingmanController.name);

  constructor(
    private readonly wingmanService: WingmanService,
    private readonly agenticService: WingmanAgenticService,
    private readonly placesService: PlacesService,
  ) {}

  /**
   * Chat with AI Wingman (supports agentic mode with tool-calling)
   * POST /wingman/chat
   */
  @Post('chat')
  async chat(@Req() req: AuthenticatedRequest, @Body() dto: ChatDto) {
    const userId = req.user.sub;
    this.logger.log(`[CHAT] User ${userId} message: "${dto.message}" useAgentic: ${dto.useAgentic !== false}`);
    
    // Use agentic service for tool-calling (default: true)
    if (dto.useAgentic !== false) {
      this.logger.log('[CHAT] Using agentic service...');
      const result = await this.agenticService.chat(userId, dto.message, {
        targetUserId: dto.targetUserId,
        chatContext: dto.chatContext,
      });
      this.logger.log(`[CHAT] Agentic response: ${result.reply?.substring(0, 100)}...`);
      return result;
    }
    
    // Fallback to simple chat
    this.logger.log('[CHAT] Using simple wingman service...');
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
    await this.agenticService.clearHistory(userId);
    return { success: true };
  }

  /**
   * Get date spot suggestions
   * POST /wingman/date-spots
   */
  @Post('date-spots')
  async getDateSpots(@Req() req: AuthenticatedRequest, @Body() dto: DateSpotsDto) {
    const userId = req.user.sub;
    const spots = await this.placesService.findDateSpots(
      userId,
      dto.matchUserId,
      dto.preferences,
    );
    return { spots };
  }

  /**
   * Search places by query
   * GET /wingman/places/search
   */
  @Get('places/search')
  async searchPlaces(
    @Req() req: AuthenticatedRequest,
    @Query('q') query: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    const places = await this.placesService.searchPlaces(
      query,
      { lat: Number(lat), lng: Number(lng) },
    );
    return { places };
  }
}
