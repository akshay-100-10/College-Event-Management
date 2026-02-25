-- STEP-BY-STEP MIGRATION FOR BOOKINGS TABLE
-- Copy each section one at a time into Supabase SQL Editor

-- ====================================
-- STEP 1: Rename student_id to user_id
-- ====================================
ALTER TABLE bookings RENAME COLUMN student_id TO user_id;

-- ====================================
-- STEP 2: Add missing columns
-- ====================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats_booked INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- ====================================
-- STEP 3: Update unique constraint
-- ====================================
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_student_id_key;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_event_id_user_id_key;
ALTER TABLE bookings ADD CONSTRAINT bookings_event_id_user_id_key UNIQUE (event_id, user_id);

-- ====================================
-- STEP 4: Update RLS Policies
-- ====================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers can view bookings for their events" ON bookings;

-- Create new policies with correct column names
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

-- ====================================
-- STEP 5: Verify the changes
-- ====================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
