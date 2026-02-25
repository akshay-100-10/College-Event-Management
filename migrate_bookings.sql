-- Migration script to update bookings table schema
-- Run this in your Supabase SQL Editor

-- Step 1: Check if student_id column exists and rename it to user_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'student_id'
    ) THEN
        ALTER TABLE bookings RENAME COLUMN student_id TO user_id;
    END IF;
END $$;

-- Step 2: Add missing columns if they don't exist
DO $$
BEGIN
    -- Add booking_date if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'booking_date'
    ) THEN
        ALTER TABLE bookings ADD COLUMN booking_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;

    -- Add seats_booked if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'seats_booked'
    ) THEN
        ALTER TABLE bookings ADD COLUMN seats_booked INTEGER DEFAULT 1;
    END IF;

    -- Add qr_code_data if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'qr_code_data'
    ) THEN
        ALTER TABLE bookings ADD COLUMN qr_code_data TEXT;
    END IF;
END $$;

-- Step 3: Update the unique constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_student_id_key;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_user_id_key;
ALTER TABLE bookings ADD CONSTRAINT bookings_event_id_user_id_key UNIQUE (event_id, user_id);

-- Step 4: Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers can view bookings for their events" ON bookings;

-- Step 5: Create updated RLS policies
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Students can create bookings" 
ON bookings FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);

CREATE POLICY "Organizers can view bookings for their events"
ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = bookings.event_id
        AND events.organizer_id = auth.uid()
    )
);

-- Verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
