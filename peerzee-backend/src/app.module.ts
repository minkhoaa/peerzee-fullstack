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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5456'),
      username: process.env.DB_USERNAME || 'peerzee',
      password: process.env.DB_PASSWORD || 'peerzee',
      database: process.env.DB_DATABASE || 'peerzee-db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
    ChatModule,
    ConversationModule,
    SwipeModule,
    CommunityModule,
    DiscoverModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
