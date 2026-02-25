-- Migration to support Sub-Event Bookings

-- 1. Create sub_event_bookings table
CREATE TABLE IF NOT EXISTS public.sub_event_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sub_event_id UUID REFERENCES public.sub_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sub_event_id, user_id) -- Prevent double booking
);

-- 2. Add RLS Policies
ALTER TABLE public.sub_event_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sub-event bookings"
    ON public.sub_event_bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sub-event bookings"
    ON public.sub_event_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can view bookings for their sub-events"
    ON public.sub_event_bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sub_events se
            JOIN public.events e ON se.event_id = e.id
            WHERE se.id = sub_event_bookings.sub_event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- 3. Update 'sub_events' to track booked seats
ALTER TABLE public.sub_events
ADD COLUMN IF NOT EXISTS booked_seats INTEGER DEFAULT 0;

-- 4. RPC Function to book a sub-event securely
CREATE OR REPLACE FUNCTION book_sub_event(
    p_sub_event_id UUID,
    p_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_seats INT;
    v_booked_seats INT;
BEGIN
    -- 1. Lock the sub_event row to prevent race conditions
    SELECT total_seats, booked_seats
    INTO v_total_seats, v_booked_seats
    FROM public.sub_events
    WHERE id = p_sub_event_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Sub-event not found');
    END IF;

    -- 2. Check if already booked
    IF EXISTS (SELECT 1 FROM public.sub_event_bookings WHERE sub_event_id = p_sub_event_id AND user_id = p_user_id) THEN
        RETURN json_build_object('success', false, 'message', 'You are already registered for this sub-event');
    END IF;

    -- 3. Check seat availability (if total_seats > 0 it's limited, if 0 it might be unlimited)
    IF v_total_seats > 0 AND v_booked_seats >= v_total_seats THEN
        RETURN json_build_object('success', false, 'message', 'This sub-event is full');
    END IF;

    -- 4. Create the booking
    INSERT INTO public.sub_event_bookings (sub_event_id, user_id)
    VALUES (p_sub_event_id, p_user_id);

    -- 5. Update booked seats count
    UPDATE public.sub_events
    SET booked_seats = booked_seats + 1
    WHERE id = p_sub_event_id;

    RETURN json_build_object('success', true, 'message', 'Successfully registered for sub-event');
END;
$$;
