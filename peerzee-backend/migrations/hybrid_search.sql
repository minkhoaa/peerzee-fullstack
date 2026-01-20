-- =============================================================================
-- Migration: Hybrid Semantic Search for User Profiles
-- Database: PostgreSQL 16 with pgvector extension
-- Embedding: Google Gemini text-embedding-004 (768 dimensions)
-- =============================================================================

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create user_gender enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_gender') THEN
        CREATE TYPE user_gender AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'OTHER');
    END IF;
END$$;

-- Step 3: Add new columns for hybrid search
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS gender user_gender,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "embeddingUpdatedAt" TIMESTAMP;

-- Step 4: Handle bioEmbedding column (drop if wrong type, create with vector type)
DO $$
BEGIN
    -- Drop if exists with wrong type (double precision[])
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
          AND column_name = 'bioEmbedding'
          AND udt_name = '_float8'
    ) THEN
        ALTER TABLE user_profiles DROP COLUMN "bioEmbedding";
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
          AND column_name = 'bio_embedding'
          AND udt_name = '_float8'
    ) THEN
        ALTER TABLE user_profiles DROP COLUMN bio_embedding;
    END IF;
END$$;

-- Add bioEmbedding with correct vector(768) type
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS "bioEmbedding" vector(768);

-- Step 5: Create indexes for hard filters (SQL)
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON user_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_city_lower ON user_profiles(LOWER(city));
CREATE INDEX IF NOT EXISTS idx_profiles_country ON user_profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_intent_mode ON user_profiles("intentMode");
CREATE INDEX IF NOT EXISTS idx_profiles_gender_city_intent ON user_profiles(gender, city, "intentMode");
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON user_profiles USING GIN(availability);

-- Step 6: Create HNSW index for vector similarity search
DROP INDEX IF EXISTS "IDX_user_profiles_embedding";
CREATE INDEX "IDX_user_profiles_embedding" ON user_profiles USING hnsw ("bioEmbedding" vector_cosine_ops);

-- Step 7: Helper function for availability check
CREATE OR REPLACE FUNCTION check_availability(availability JSONB, time_slot TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((availability->>time_slot)::boolean, false);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verification
SELECT column_name, udt_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('gender', 'city', 'bioEmbedding', 'availability');
