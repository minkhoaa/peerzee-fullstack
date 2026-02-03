import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { join } from 'path';
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
import { RedisModule } from './redis/redis.module';
import { AgentsModule } from './agents/agents.module';
import config from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Serve uploaded files (images, videos) from /uploads path
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),
    MikroOrmModule.forRoot(config),
    RedisModule,
    UserModule,
    ChatModule,
    ConversationModule,
    SwipeModule,
    CommunityModule,
    DiscoverModule,
    NotificationModule,
    VideoDatingModule,
    AiModule,
    AgentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) { }

  async onModuleInit() {
    // 1. Create pgvector extension if it doesn't exist
    try {
      await this.orm.em.getConnection().execute('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (error) {
      console.error('Failed to create pgvector extension:', error);
    }

    // 2. Update schema safely (no data loss)
    try {
      const generator = this.orm.getSchemaGenerator();
      await generator.updateSchema();
      console.log('✅ Database schema synchronized');
    } catch (error) {
      console.error('Failed to update schema:', error);
    }
  }
}



