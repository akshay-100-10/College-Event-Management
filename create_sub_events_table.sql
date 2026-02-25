
-- Crate SUB_EVENTS table (Missing from original setup)
CREATE TABLE IF NOT EXISTS public.sub_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  venue TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  total_seats INTEGER DEFAULT 0,
  requires_registration BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.sub_events ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can view sub-events for approved events OR if they are the organizer
DROP POLICY IF EXISTS "Public can view sub_events" ON public.sub_events;
CREATE POLICY "Public can view sub_events" ON public.sub_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = sub_events.event_id 
      AND (events.status = 'approved' OR events.organizer_id = auth.uid())
    )
  );

-- 2. Organizers can insert sub-events for their own events
DROP POLICY IF EXISTS "Organizers can insert sub_events" ON public.sub_events;
CREATE POLICY "Organizers can insert sub_events" ON public.sub_events 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = sub_events.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- 3. Organizers can update their own sub-events
DROP POLICY IF EXISTS "Organizers can update sub_events" ON public.sub_events;
CREATE POLICY "Organizers can update sub_events" ON public.sub_events 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = sub_events.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- 4. Organizers can delete their own sub-events
DROP POLICY IF EXISTS "Organizers can delete sub_events" ON public.sub_events;
CREATE POLICY "Organizers can delete sub_events" ON public.sub_events 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = sub_events.event_id 
      AND events.organizer_id = auth.uid()
    )
  );
