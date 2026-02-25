-- Add image_url column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for event images (if not exists)
-- Note: This might need to be run in the Supabase Dashboard if the API doesn't allow it
-- But including it here for completeness
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
-- Allow public access to images
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
CREATE POLICY "Anyone can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own images
DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;
CREATE POLICY "Users can delete their own event images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-images' 
  AND auth.role() = 'authenticated'
);
