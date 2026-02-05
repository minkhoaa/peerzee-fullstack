import { Module, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Participant } from './entities/participants.entity';
import { JwtModule } from '@nestjs/jwt';
import { MessageReaction } from './entities/message-reaction.entity';
import { IceBreaker } from './entities/ice-breaker.entity';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UserModule } from '../user/user.module';
import { UserProfile } from '../user/entities/user-profile.entity';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';
import { VoiceService } from './voice.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Conversation, Message, Participant, MessageReaction, IceBreaker, UserProfile]),
    JwtModule.register({}),
    UserModule,
    AiModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => GamificationModule),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  ],
  controllers: [UploadController, ChatController],
  providers: [ChatGateway, ChatService, VoiceService],
  exports: [ChatService, VoiceService],
})
export class ChatModule { }

