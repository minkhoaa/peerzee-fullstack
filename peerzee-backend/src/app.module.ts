import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { WingmanModule } from './wingman/wingman.module';
import config from './mikro-orm.config';

import { GamificationModule } from './gamification/gamification.module';
import { WhisperModule } from './whisper/whisper.module';

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
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 30,   // 30 requests per minute default
    }]),
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
    WingmanModule,
    GamificationModule,
    WhisperModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) { }

  async onModuleInit() {
    // Run pending database migrations
    try {
      const migrator = this.orm.getMigrator();
      const pending = await migrator.getPendingMigrations();
      if (pending.length > 0) {
        console.log(`Running ${pending.length} pending migration(s)...`);
        await migrator.up();
        console.log('✅ Database migrations applied');
      } else {
        console.log('✅ Database schema up to date');
      }
    } catch (error) {
      console.error('Failed to run migrations:', error);
    }

    // Sync schema for any remaining entity changes (safe mode — no drops)
    try {
      const generator = this.orm.getSchemaGenerator();
      await generator.updateSchema({ safe: true });
      console.log('✅ Database schema synchronized');
    } catch (error) {
      console.error('Failed to update schema:', error);
    }
  }
}



