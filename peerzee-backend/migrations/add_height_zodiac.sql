-- Migration: Add height and zodiac columns to user_profiles
-- Run this after disabling TypeORM synchronize

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS height VARCHAR(10),
ADD COLUMN IF NOT EXISTS zodiac VARCHAR(50);
