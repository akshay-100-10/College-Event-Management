-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'college', 'student')) DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
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

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    organizer_id UUID REFERENCES profiles(id) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    capacity INTEGER NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved events are viewable by everyone" 
ON events FOR SELECT USING (status = 'approved' OR auth.uid() = organizer_id);

CREATE POLICY "Colleges can insert events" 
ON events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'college')
);

CREATE POLICY "Organizers can update own events" 
ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    seats_booked INTEGER DEFAULT 1,
    qr_code_data TEXT,
    UNIQUE(event_id, user_id)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can create bookings" 
ON bookings FOR INSERT WITH CHECK (
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
