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
BEGIN
  -- Lock the event row for update to prevent race conditions
  SELECT * INTO v_event
  FROM events 
  WHERE id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  -- Check if event is in the past
  -- Combine date and time to check properly
  v_event_timestamp := (v_event.date || ' ' || v_event.time)::TIMESTAMP;
  
  IF v_event_timestamp < NOW() THEN
     RETURN jsonb_build_object('success', false, 'message', 'Event has already occurred');
  END IF;

  -- Check availability
  IF v_event.booked_seats + p_seats > v_event.total_seats THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not enough seats available');
  END IF;

  -- Check if user already booked
  IF EXISTS (SELECT 1 FROM bookings WHERE event_id = p_event_id AND user_id = p_user_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'You have already booked this event');
  END IF;

  -- Generate QR code data
  v_qr_code := 'TICKET-' || p_event_id || '-' || p_user_id || '-' || EXTRACT(EPOCH FROM NOW());

  -- Insert booking
  INSERT INTO bookings (user_id, event_id, seats_booked, status, qr_code_data)
  VALUES (p_user_id, p_event_id, p_seats, 'confirmed', v_qr_code)
  RETURNING id INTO v_booking_id;

  -- Update event seats
  UPDATE events
  SET booked_seats = booked_seats + p_seats
  WHERE id = p_event_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;