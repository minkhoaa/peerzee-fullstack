import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { AuthGuard } from 'src/user/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';

@Controller('conversation')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly jwtService: JwtService
  ) { }

  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard)
  @Get()
  findAllByUserId(@CurrentUser('user_id') user_id: string) {
    return this.conversationService.findAllByUserId(user_id);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get conversation with icebreaker status' })
  findOne(@Param('id') id: string, @CurrentUser('user_id') userId: string) {
    return this.conversationService.getConversationWithIcebreaker(id, userId);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(AuthGuard)
  @Post(':id/icebreaker-answer')
  @ApiOperation({ summary: 'Submit icebreaker answer' })
  @ApiBody({ schema: { properties: { answer: { type: 'string' } } } })
  submitIcebreakerAnswer(
    @Param('id') id: string,
    @Body('answer') answer: string,
    @CurrentUser('user_id') userId: string,
  ) {
    return this.conversationService.submitIcebreakerAnswer(id, userId, answer);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConversationDto: UpdateConversationDto) {
    return this.conversationService.update(+id, updateConversationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(+id);
  }
}

