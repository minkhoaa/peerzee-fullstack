import { Migration } from '@mikro-orm/migrations';

/**
 * Consolidates all raw ALTER TABLE statements from the old onModuleInit()
 * into a single idempotent migration. Each statement uses IF NOT EXISTS
 * or DO...EXCEPTION blocks to be safely re-runnable.
 */
export class Migration_001_initial_schema_fixes extends Migration {
  async up(): Promise<void> {
    // 1. Create pgvector extension
    this.addSql('CREATE EXTENSION IF NOT EXISTS vector;');

    // 2. Fix social_posts.tags: ensure jsonb type
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE social_posts ALTER COLUMN tags TYPE jsonb USING to_jsonb(tags);
      EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);

    // 3. Fix users.blocked_user_ids: jsonb -> text[]
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE users ALTER COLUMN blocked_user_ids TYPE text[]
        USING CASE
          WHEN jsonb_typeof(blocked_user_ids) = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(blocked_user_ids))
          ELSE '{}'::text[]
        END;
      EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);

    // 4. Fix user_profiles.tags: -> text[]
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE user_profiles ALTER COLUMN tags TYPE text[]
        USING CASE
          WHEN jsonb_typeof(to_jsonb(tags)) = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(to_jsonb(tags)))
          ELSE '{}'::text[]
        END;
      EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);

    // 5. Fix user_profiles.hidden_keywords: -> text[]
    this.addSql(`
      DO $$ BEGIN
        ALTER TABLE user_profiles ALTER COLUMN hidden_keywords TYPE text[]
        USING CASE
          WHEN jsonb_typeof(to_jsonb(hidden_keywords)) = 'array' THEN
            ARRAY(SELECT jsonb_array_elements_text(to_jsonb(hidden_keywords)))
          ELSE '{}'::text[]
        END;
      EXCEPTION
        WHEN undefined_table THEN NULL;
        WHEN undefined_column THEN NULL;
        WHEN others THEN NULL;
      END $$;
    `);

    // 6. Ensure bio_embedding column exists (snake_case — matches entity fieldName)
    this.addSql(`
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio_embedding vector(768);
    `);

    // 7. Drop duplicate camelCase column if it exists
    this.addSql(`
      ALTER TABLE user_profiles DROP COLUMN IF EXISTS "bioEmbedding";
    `);

    // 8. Create intent_mode enum type
    this.addSql(`
      DO $$ BEGIN
        CREATE TYPE intent_mode_enum AS ENUM ('DATE', 'STUDY', 'FRIEND');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 9. Add missing user_profiles columns
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS intent_mode varchar(20) DEFAULT 'DATE';`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_properties jsonb DEFAULT '{}';`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{}';`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender varchar(20);`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active timestamp;`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp;`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS city varchar(100);`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS region varchar(100);`);
    this.addSql(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country varchar(2);`);

    // 10. Add GIN index for efficient blocked user lookups
    this.addSql(`
      CREATE INDEX IF NOT EXISTS idx_users_blocked_ids ON users USING GIN (blocked_user_ids);
    `);
  }

  async down(): Promise<void> {
    // Drop index
    this.addSql('DROP INDEX IF EXISTS idx_users_blocked_ids;');
  }
}
