-- Add location column to events table to separate it from venue
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS location TEXT;

-- If the existing column is named 'location' but used as 'venue' in code, 
-- we might want to rename it to 'venue' and add a new 'location' column.
-- However, based on the user's request and the current code using 'venue',
-- it's safer to just ensure both exist.

-- Update existing events to have a default location if needed
UPDATE events SET location = venue WHERE location IS NULL;

-- Make location NOT NULL after populating it
ALTER TABLE events ALTER COLUMN location SET NOT NULL;
