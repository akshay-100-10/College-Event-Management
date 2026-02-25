ALTER TABLE events 
ADD COLUMN IF NOT EXISTS registration_type TEXT CHECK (registration_type IN ('internal', 'external')) DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS external_registration_url TEXT;
