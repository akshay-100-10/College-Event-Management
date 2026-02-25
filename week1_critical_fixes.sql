-- =====================================================
-- Week 1: Critical Database Fixes
-- =====================================================
-- This file contains all critical database improvements
-- for the College Event Booking System
-- =====================================================

-- =====================================================
-- 1. ENHANCED BOOKING FUNCTION (Race Condition Fix)
-- =====================================================
-- Improvements over existing function:
-- - Better error messages
-- - Unique QR code generation
-- - Transaction safety with FOR UPDATE lock
-- =====================================================

CREATE OR REPLACE FUNCTION book_event(
  p_event_id UUID,
  p_user_id UUID,
  p_seats INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_booking_id UUID;
  v_qr_code TEXT;
  v_event_timestamp TIMESTAMP;
  v_available_seats INTEGER;
BEGIN
  -- Lock the event row for update to prevent race conditions
  -- This is CRITICAL for preventing overbooking
  SELECT * INTO v_event
  FROM events 
  WHERE id = p_event_id
  FOR UPDATE;  -- Locks the row until transaction completes

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  -- Check if event is approved
  IF v_event.status != 'approved' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event is not available for booking');
  END IF;

  -- Check if event is in the past
  v_event_timestamp := (v_event.date || ' ' || v_event.time)::TIMESTAMP;
  
  IF v_event_timestamp < NOW() THEN
     RETURN jsonb_build_object('success', false, 'message', 'This event has already occurred and cannot be booked');
  END IF;

  -- Calculate available seats
  v_available_seats := v_event.total_seats - v_event.booked_seats;

  -- Check availability with clear messaging
  IF v_available_seats < p_seats THEN
    IF v_available_seats = 0 THEN
      RETURN jsonb_build_object('success', false, 'message', 'Event is sold out');
    ELSE
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Only ' || v_available_seats || ' seat(s) available'
      );
    END IF;
  END IF;

  -- Check if user already booked (prevent duplicates)
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE event_id = p_event_id 
    AND user_id = p_user_id 
    AND status = 'confirmed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'You have already booked this event');
  END IF;

  -- Validate seat count
  IF p_seats < 1 OR p_seats > 10 THEN
    RETURN jsonb_build_object('success', false, 'message', 'You can book between 1 and 10 seats');
  END IF;

  -- Generate unique QR code using UUID
  v_qr_code := 'TICKET-' || gen_random_uuid()::TEXT;

  -- Insert booking
  INSERT INTO bookings (user_id, event_id, seats_booked, status, qr_code_data, booking_date)
  VALUES (p_user_id, p_event_id, p_seats, 'confirmed', v_qr_code, NOW())
  RETURNING id INTO v_booking_id;

  -- Update event seats atomically
  UPDATE events
  SET booked_seats = booked_seats + p_seats
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'success', true, 
    'booking_id', v_booking_id,
    'qr_code', v_qr_code,
    'message', 'Booking confirmed successfully'
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Booking failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. DUPLICATE BOOKING PREVENTION (Database Constraint)
-- =====================================================

-- Add unique constraint to prevent duplicate bookings at database level
-- This works alongside the function check for defense in depth
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings(user_id, event_id) 
WHERE status = 'confirmed';

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on critical tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users create own bookings" ON bookings;
DROP POLICY IF EXISTS "Users update own bookings" ON bookings;
DROP POLICY IF EXISTS "Organizers view event bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view approved events" ON events;
DROP POLICY IF EXISTS "Organizers manage own events" ON events;

-- BOOKINGS POLICIES

-- Users can view their own bookings
CREATE POLICY "Users view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Users can create bookings for themselves only
CREATE POLICY "Users create own bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (for cancellation)
CREATE POLICY "Users update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Organizers can view bookings for their events
CREATE POLICY "Organizers view event bookings"
ON bookings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM events
        WHERE events.id = bookings.event_id
        AND events.organizer_id = auth.uid()
    )
);

-- EVENTS POLICIES

-- Everyone can view approved events
CREATE POLICY "Public can view approved events"
ON events FOR SELECT
USING (status = 'approved' OR organizer_id = auth.uid());

-- Organizers can manage their own events
CREATE POLICY "Organizers manage own events"
ON events FOR ALL
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- =====================================================
-- 4. DATABASE INDEXES FOR PERFORMANCE
-- =====================================================

-- Critical indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, date) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_bookings_user_event ON bookings(user_id, event_id);

-- =====================================================
-- 5. ADD MISSING COLUMNS FOR FUTURE FEATURES
-- =====================================================

-- Add cancellation deadline support
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS cancellation_deadline_hours INTEGER DEFAULT 24;

-- Add booking date if not exists
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP DEFAULT NOW();

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('bookings', 'events');

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('bookings', 'events');

-- Check indexes exist
SELECT tablename, indexname 
FROM pg_indexes 
WHERE tablename IN ('bookings', 'events')
ORDER BY tablename, indexname;

-- =====================================================
-- DEPLOYMENT INSTRUCTIONS
-- =====================================================
-- 1. Run this entire file in Supabase SQL Editor
-- 2. Verify no errors in the output
-- 3. Run verification queries at the end
-- 4. Test booking flow in the application
-- =====================================================
