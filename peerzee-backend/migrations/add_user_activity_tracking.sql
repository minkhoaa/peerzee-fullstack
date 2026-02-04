-- Migration: Add last_active_at for proactive notifications
-- Date: 2026-02-05

-- ============================================
-- USER ACTIVITY TRACKING
-- ============================================

-- Add last_active_at column for proactive notification triggers
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Index for finding inactive users quickly
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- ============================================
-- UPDATE FUNCTION: Auto-update last_active_at
-- ============================================

-- Function to update last_active_at (call from various services)
CREATE OR REPLACE FUNCTION update_user_last_active(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users SET last_active_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- WINGMAN NOTIFICATION TYPE
-- ============================================

-- Add WINGMAN_TIP to notification_type enum if not exists
DO $$ 
BEGIN
    -- Check if the enum value exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'WINGMAN_TIP' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notificationtype')
    ) THEN
        ALTER TYPE notificationtype ADD VALUE 'WINGMAN_TIP';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add WINGMAN_TIP enum value, may already exist or enum does not exist';
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'last_active_at';
