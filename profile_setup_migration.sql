-- Profile Setup Wizard Migration
-- Run this in your Supabase SQL Editor

-- Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS department       TEXT,
  ADD COLUMN IF NOT EXISTS phone            TEXT,
  ADD COLUMN IF NOT EXISTS bio              TEXT,
  ADD COLUMN IF NOT EXISTS interests        TEXT[],
  ADD COLUMN IF NOT EXISTS college_name     TEXT,
  ADD COLUMN IF NOT EXISTS college_website  TEXT,
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Mark existing profiles as complete so they are not redirected to the wizard
UPDATE profiles
SET profile_complete = TRUE
WHERE profile_complete IS NULL OR profile_complete = FALSE;

-- Verify the migration
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
