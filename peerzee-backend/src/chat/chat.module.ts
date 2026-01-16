import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Participant } from './entities/participants.entity';
import { JwtModule } from '@nestjs/jwt';
import { MessageReaction } from './entities/message-reaction.entity';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UserModule } from '../user/user.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Participant, MessageReaction]),
    JwtModule.register({}),
    UserModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      })
    }),
  ],
  controllers: [UploadController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule { }
