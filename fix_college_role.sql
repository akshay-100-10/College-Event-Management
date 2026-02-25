-- ═══════════════════════════════════════════════════════════════
-- Fix: Roles missing from profiles + check constraint issue
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Drop the existing check constraint that blocks 'college'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Recreate it with 'college' included
ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'college', 'admin', 'faculty'));

-- Step 3: Fix christ3 immediately
UPDATE profiles
SET role = 'college'
WHERE email = 'christ3@gmail.com';

-- Step 4: Fix any other profile missing a role by reading auth metadata
UPDATE profiles p
SET role = COALESCE(
    (SELECT raw_user_meta_data->>'role'
     FROM auth.users u
     WHERE u.id = p.id
    ),
    'student'
)
WHERE p.role IS NULL OR p.role = '';

-- Step 5: Fix the trigger so this never happens again for new registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, profile_complete)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        FALSE
    )
    ON CONFLICT (id) DO UPDATE
        SET role = COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name);
    RETURN NEW;
END;
$$;

-- Verify
SELECT id, email, role, full_name FROM profiles ORDER BY created_at DESC LIMIT 10;
