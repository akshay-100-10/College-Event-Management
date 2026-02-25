-- TRUNCATE events table and cascade to delete all dependent data 
-- (bookings, event_likes, etc.)
TRUNCATE TABLE events CASCADE;
