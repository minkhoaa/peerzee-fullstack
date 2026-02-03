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

    // 2. Auto-fix common schema issues before syncing
    const connection = this.orm.em.getConnection();

    try {
      // Fix social_posts.tags type mismatch (text[] -> jsonb)
      // This is a known issue where ORM cannot auto-cast existing data
      await connection.execute(`
        ALTER TABLE social_posts 
        ALTER COLUMN tags TYPE jsonb 
        USING to_jsonb(tags)
      `);
      console.log('✅ Auto-fixed social_posts.tags column type');
    } catch (e: any) {
      // Ignore if already fixed or table doesn't exist
      if (!e.message.includes('does not exist') && !e.message.includes('no schema has been selected')) {
        // console.warn('Schema fix skipped (probably already correct):', e.message);
      }
    }

    try {
      // Fix users.blocked_user_ids type mismatch (jsonb -> text[])
      // First make it nullable, then convert type
      await connection.execute(`
        ALTER TABLE users 
        ALTER COLUMN blocked_user_ids DROP NOT NULL
      `);
      await connection.execute(`
        ALTER TABLE users 
        ALTER COLUMN blocked_user_ids TYPE text[] 
        USING CASE 
          WHEN blocked_user_ids IS NULL THEN '{}'::text[]
          WHEN jsonb_typeof(blocked_user_ids) = 'array' THEN 
            ARRAY(SELECT jsonb_array_elements_text(blocked_user_ids))
          ELSE '{}'::text[]
        END
      `);
      await connection.execute(`
        ALTER TABLE users 
        ALTER COLUMN blocked_user_ids SET DEFAULT '{}'
      `);
      console.log('✅ Auto-fixed users.blocked_user_ids column type');
    } catch (e: any) {
      // Ignore if already fixed or table doesn't exist
      if (!e.message.includes('does not exist') && !e.message.includes('already') && !e.message.includes('text[]')) {
        // console.warn('blocked_user_ids fix skipped:', e.message);
      }
    }

    try {
      // Ensure bio_embedding column exists for AI
      await connection.execute(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS "bioEmbedding" vector(768)
      `);
      // Note: We use "bioEmbedding" (quoted) if that matches what MikroORM expects 
      // OR snake_case "bio_embedding" if standard. Based on previous fix, we want snake_case.
      await connection.execute(`
        ALTER TABLE user_profiles 
        ADD COLUMN IF NOT EXISTS bio_embedding vector(768)
      `);
      console.log('✅ Auto-fixed bio_embedding column');
    } catch (e) {
      console.warn('Bio embedding fix warning:', e);
    }

    // 3. Update schema safely (no data loss)
    try {
      const generator = this.orm.getSchemaGenerator();
      await generator.updateSchema({ safe: true }); // Safe mode prevents dropping tables/data
      console.log('✅ Database schema synchronized');
    } catch (error) {
      console.error('Failed to update schema:', error);
    }
  }
}



