-- CRITICAL FIX: Allow organizers to see bookings for their events
-- Copy this ENTIRE script and run it in Supabase SQL Editor

-- First, let's check current state
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Add missing columns if needed
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats_booked INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- Fix unique constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_student_id_key;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_user_id_key;
ALTER TABLE bookings ADD CONSTRAINT bookings_event_id_user_id_key UNIQUE (event_id, user_id);

-- DROP ALL existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers can view bookings for their events" ON bookings;

-- CREATE CORRECTED POLICIES
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Students can create bookings" 
ON bookings FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);

-- THIS IS THE KEY POLICY - allows organizers to see bookings
CREATE POLICY "Organizers can view bookings for their events"
ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = bookings.event_id
        AND events.organizer_id = auth.uid()
    )
);

-- Verify policies were created
SELECT 
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'bookings';

-- Check if bookings exist
SELECT 
    b.id,
    b.event_id,
    b.user_id,
    e.title as event_title,
    e.organizer_id,
    p.full_name as student_name
FROM bookings b
JOIN events e ON b.event_id = e.id
JOIN profiles p ON b.user_id = p.id
LIMIT 10;
