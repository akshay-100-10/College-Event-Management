-- Enable RLS on tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- EVENTS POLICIES

-- Anyone can view approved events
CREATE POLICY "Public can view approved events"
ON events FOR SELECT
USING (status = 'approved');

-- Organizers can view their own events (all statuses)
CREATE POLICY "Organizers can view own events"
ON events FOR SELECT
USING (auth.uid() = organizer_id);

-- Organizers can insert their own events
CREATE POLICY "Organizers can insert own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = organizer_id);

-- Organizers can update their own events
CREATE POLICY "Organizers can update own events"
ON events FOR UPDATE
USING (auth.uid() = organizer_id);

-- Organizers can delete their own events
CREATE POLICY "Organizers can delete own events"
ON events FOR DELETE
USING (auth.uid() = organizer_id);


-- BOOKINGS POLICIES

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Organizers can view bookings for their events
CREATE POLICY "Organizers can view bookings for their events"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id = bookings.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Users can create bookings (for themselves)
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings (e.g. cancel)
CREATE POLICY "Users can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = user_id);


-- PROFILES POLICIES

-- Public can view basic profile info
CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
