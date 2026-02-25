-- Create event_likes table
CREATE TABLE IF NOT EXISTS event_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE event_likes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own likes" ON event_likes;
CREATE POLICY "Users can view own likes" ON event_likes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own likes" ON event_likes;
CREATE POLICY "Users can create own likes" ON event_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON event_likes;
CREATE POLICY "Users can delete own likes" ON event_likes FOR DELETE USING (auth.uid() = user_id);
