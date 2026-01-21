import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { ConversationModule } from './conversation/conversation.module';
import { SwipeModule } from './swipe/swipe.module';
import { CommunityModule } from './community/community.module';
import { DiscoverModule } from './discover/discover.module';
import { NotificationModule } from './notification/notification.module';
import { VideoDatingModule } from './video-dating/video-dating.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'peerzee',
      password: process.env.DB_PASSWORD || 'peerzee',
      database: process.env.DB_DATABASE || 'peerzee-db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Disabled to preserve vector(768) column type from migration
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }),
    UserModule,
    ChatModule,
    ConversationModule,
    SwipeModule,
    CommunityModule,
    DiscoverModule,
    NotificationModule,
    VideoDatingModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
