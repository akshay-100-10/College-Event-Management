-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'college', 'student')) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 0,
  booked_seats INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure events columns exist (idempotent)
ALTER TABLE events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_seats INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS booked_seats INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS brochure_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'internal';
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_registration_url TEXT;

-- 3. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seats_booked INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure bookings columns exist
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS seats_booked INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Events
DROP POLICY IF EXISTS "Public can view approved events" ON events;
CREATE POLICY "Public can view approved events" ON events FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Organizers can view own events" ON events;
CREATE POLICY "Organizers can view own events" ON events FOR SELECT USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can insert own events" ON events;
CREATE POLICY "Organizers can insert own events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can update own events" ON events;
CREATE POLICY "Organizers can update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete own events" ON events;
CREATE POLICY "Organizers can delete own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- Bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can view bookings for their events" ON bookings;
CREATE POLICY "Organizers can view bookings for their events" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = bookings.event_id AND events.organizer_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create Booking Transaction Function (RPC)
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
  -- Lock the event row
  SELECT * INTO v_event FROM events WHERE id = p_event_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Event not found');
  END IF;

  -- Check past event
  -- Cast date and time to timestamp. Assumes date is DATE and time is TEXT (HH:MM:SS)
  v_event_timestamp := (v_event.date || ' ' || v_event.time)::TIMESTAMP;
  
  IF v_event_timestamp < NOW() THEN
     RETURN jsonb_build_object('success', false, 'message', 'Event has already occurred');
  END IF;

  -- Check availability
  IF v_event.booked_seats + p_seats > v_event.total_seats THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not enough seats available');
  END IF;

  -- Check existing booking
  IF EXISTS (SELECT 1 FROM bookings WHERE event_id = p_event_id AND user_id = p_user_id) THEN
      RETURN jsonb_build_object('success', false, 'message', 'You have already booked this event');
  END IF;

  -- Generate QR
  v_qr_code := 'TICKET-' || p_event_id || '-' || p_user_id || '-' || EXTRACT(EPOCH FROM NOW());

  -- Insert booking
  INSERT INTO bookings (user_id, event_id, seats_booked, status, qr_code_data)
  VALUES (p_user_id, p_event_id, p_seats, 'confirmed', v_qr_code)
  RETURNING id INTO v_booking_id;

  -- Update event
  UPDATE events SET booked_seats = booked_seats + p_seats WHERE id = p_event_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
