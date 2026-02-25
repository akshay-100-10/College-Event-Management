-- ═══════════════════════════════════════════════════════════════
-- Fix: Ensure sub_events table has all required columns
-- Run this in Supabase SQL Editor if you get a 400 on sub_events
-- ═══════════════════════════════════════════════════════════════

-- Add missing columns if they don't exist
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS title           TEXT NOT NULL DEFAULT '';
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS description     TEXT;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS start_time      TEXT;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS end_time        TEXT;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS venue           TEXT;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS price           NUMERIC DEFAULT 0;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS total_seats     INTEGER DEFAULT 100;
ALTER TABLE sub_events ADD COLUMN IF NOT EXISTS requires_registration BOOLEAN DEFAULT TRUE;

-- Verify the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sub_events'
ORDER BY ordinal_position;
