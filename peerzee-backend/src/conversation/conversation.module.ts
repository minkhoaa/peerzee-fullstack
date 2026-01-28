import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Conversation } from 'src/chat/entities/conversation.entity';
import { Participant } from 'src/chat/entities/participants.entity';
import { Message } from 'src/chat/entities/message.entity';
import { AuthGuard } from 'src/user/guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [MikroOrmModule.forFeature([Conversation, Participant, Message]),
  JwtModule.register({ secret: process.env.JWT_SECRET })
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule { }
