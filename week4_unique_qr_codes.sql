-- =====================================================
-- Week 4: Advanced Features - Unique QR Codes Per Seat
-- =====================================================
-- This migration adds support for individual ticket QR codes
-- allowing proper validation of each seat separately
-- =====================================================

-- =====================================================
-- 1. CREATE BOOKING_TICKETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    qr_code_data TEXT UNIQUE NOT NULL,
    checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP,
    checked_in_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure seat numbers are positive
    CONSTRAINT positive_seat_number CHECK (seat_number > 0),
    
    -- Ensure unique seat numbers per booking
    CONSTRAINT unique_seat_per_booking UNIQUE (booking_id, seat_number)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_booking_tickets_booking_id ON booking_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_tickets_qr_code ON booking_tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_booking_tickets_checked_in ON booking_tickets(checked_in) WHERE checked_in = FALSE;

-- =====================================================
-- 3. ENABLE RLS ON BOOKING_TICKETS
-- =====================================================

ALTER TABLE booking_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view tickets for their own bookings
CREATE POLICY "Users view own tickets"
ON booking_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings
        WHERE bookings.id = booking_tickets.booking_id
        AND bookings.user_id = auth.uid()
    )
);

-- Organizers can view tickets for their events
CREATE POLICY "Organizers view event tickets"
ON booking_tickets FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM bookings
        JOIN events ON events.id = bookings.event_id
        WHERE bookings.id = booking_tickets.booking_id
        AND events.organizer_id = auth.uid()
    )
);

-- Organizers can update check-in status for their events
CREATE POLICY "Organizers check-in tickets"
ON booking_tickets FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM bookings
        JOIN events ON events.id = bookings.event_id
        WHERE bookings.id = booking_tickets.booking_id
        AND events.organizer_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM bookings
        JOIN events ON events.id = bookings.event_id
        WHERE bookings.id = booking_tickets.booking_id
        AND events.organizer_id = auth.uid()
    )
);

-- =====================================================
-- 4. UPDATE BOOK_EVENT FUNCTION TO GENERATE INDIVIDUAL TICKETS
-- =====================================================

CREATE OR REPLACE FUNCTION book_event(
  p_event_id UUID,
  p_user_id UUID,
  p_seats INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_booking_id UUID;
  v_event_timestamp TIMESTAMP;
  v_available_seats INTEGER;
  i INTEGER;
BEGIN
  -- Lock the event row for update to prevent race conditions
  SELECT * INTO v_event
  FROM events 
  WHERE id = p_event_id
  FOR UPDATE;

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

  -- Check availability
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

  -- Check if user already booked
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

  -- Insert booking (without qr_code_data in main booking)
  INSERT INTO bookings (user_id, event_id, seats_booked, status, booking_date)
  VALUES (p_user_id, p_event_id, p_seats, 'confirmed', NOW())
  RETURNING id INTO v_booking_id;

  -- Generate individual tickets with unique QR codes
  FOR i IN 1..p_seats LOOP
    INSERT INTO booking_tickets (booking_id, seat_number, qr_code_data)
    VALUES (
      v_booking_id, 
      i, 
      'TICKET-' || gen_random_uuid()::TEXT
    );
  END LOOP;

  -- Update event seats atomically
  UPDATE events
  SET booked_seats = booked_seats + p_seats
  WHERE id = p_event_id;

  RETURN jsonb_build_object(
    'success', true, 
    'booking_id', v_booking_id,
    'message', 'Booking confirmed successfully'
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Booking failed: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CREATE TICKET CHECK-IN FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_in_ticket(
  p_qr_code_data TEXT,
  p_organizer_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_event_id UUID;
BEGIN
  -- Find the ticket
  SELECT bt.*, b.event_id INTO v_ticket
  FROM booking_tickets bt
  JOIN bookings b ON b.id = bt.booking_id
  WHERE bt.qr_code_data = p_qr_code_data;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid ticket');
  END IF;

  -- Verify organizer owns this event
  IF NOT EXISTS (
    SELECT 1 FROM events
    WHERE id = v_ticket.event_id
    AND organizer_id = p_organizer_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  -- Check if already checked in
  IF v_ticket.checked_in THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Ticket already checked in at ' || v_ticket.checked_in_at::TEXT
    );
  END IF;

  -- Mark as checked in
  UPDATE booking_tickets
  SET 
    checked_in = TRUE,
    checked_in_at = NOW(),
    checked_in_by = p_organizer_id
  WHERE id = v_ticket.id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Check-in successful',
    'seat_number', v_ticket.seat_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. MIGRATION FOR EXISTING BOOKINGS (OPTIONAL)
-- =====================================================
-- This creates tickets for existing bookings that don't have them

DO $$
DECLARE
  booking_record RECORD;
  i INTEGER;
BEGIN
  FOR booking_record IN 
    SELECT id, seats_booked, qr_code_data 
    FROM bookings 
    WHERE NOT EXISTS (
      SELECT 1 FROM booking_tickets WHERE booking_id = bookings.id
    )
  LOOP
    FOR i IN 1..booking_record.seats_booked LOOP
      INSERT INTO booking_tickets (booking_id, seat_number, qr_code_data)
      VALUES (
        booking_record.id,
        i,
        COALESCE(booking_record.qr_code_data, 'TICKET-' || gen_random_uuid()::TEXT) || '-SEAT-' || i
      )
      ON CONFLICT (qr_code_data) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'booking_tickets'
);

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'booking_tickets';

-- Check policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'booking_tickets';

-- Sample query: Get all tickets for a booking
-- SELECT * FROM booking_tickets WHERE booking_id = 'your-booking-id';

-- =====================================================
-- DEPLOYMENT NOTES
-- =====================================================
-- 1. Run this file in Supabase SQL Editor
-- 2. Existing bookings will automatically get individual tickets
-- 3. New bookings will generate unique QR codes per seat
-- 4. Update frontend to fetch tickets from booking_tickets table
-- 5. Implement QR scanner using check_in_ticket function
-- =====================================================
