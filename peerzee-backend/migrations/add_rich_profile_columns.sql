-- Migration: Add rich profile fields to user_profiles table
-- Run this SQL to add the new JSONB columns for rich profiles

-- Add new columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS education VARCHAR(255),
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS prompts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS discovery_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS spotify JSONB,
ADD COLUMN IF NOT EXISTS instagram VARCHAR(100),
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Add new columns to user_swipes for Hinge-style matching
ALTER TABLE user_swipes
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS liked_content_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS liked_content_type VARCHAR(50);

-- Add SUPER_LIKE to action enum if PostgreSQL supports it
-- Note: If enum already exists, you may need to handle this differently
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPER_LIKE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_swipes_action_enum')) THEN
        ALTER TYPE user_swipes_action_enum ADD VALUE 'SUPER_LIKE';
    END IF;
END$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_age ON user_profiles(age);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_swipes_message ON user_swipes(liked_content_id) WHERE liked_content_id IS NOT NULL;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
