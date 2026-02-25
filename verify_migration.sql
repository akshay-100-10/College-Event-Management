-- Quick verification query
-- Run this in Supabase SQL Editor to confirm migration worked

SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;

-- Also check if you have any bookings
SELECT COUNT(*) as total_bookings FROM bookings;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'bookings';
