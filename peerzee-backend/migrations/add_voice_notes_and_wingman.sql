-- Migration: Add Voice Notes fields and Wingman conversations
-- Date: 2026-02-04

-- ============================================
-- VOICE NOTES: Add fields to message table
-- ============================================

-- Audio duration in seconds
ALTER TABLE message ADD COLUMN IF NOT EXISTS audio_duration INT;

-- AI transcribed text
ALTER TABLE message ADD COLUMN IF NOT EXISTS transcription TEXT;

-- Voice analysis (sentiment, emotion, confidence)
ALTER TABLE message ADD COLUMN IF NOT EXISTS voice_analysis JSONB;

-- ============================================
-- AI WINGMAN: Create conversations table
-- ============================================

CREATE TABLE IF NOT EXISTS wingman_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_wingman_user ON wingman_conversations(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_wingman_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wingman_updated_at ON wingman_conversations;
CREATE TRIGGER trigger_wingman_updated_at
    BEFORE UPDATE ON wingman_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_wingman_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'message' AND column_name IN ('audio_duration', 'transcription', 'voice_analysis');
-- SELECT * FROM wingman_conversations LIMIT 1;
