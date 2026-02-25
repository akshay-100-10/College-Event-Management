-- Create a view to calculate student points dynamically
CREATE OR REPLACE VIEW student_leaderboard AS
SELECT 
    p.id as student_id,
    p.full_name,
    p.email,
    -- 10 points per booking
    (COUNT(DISTINCT b.id) * 10) +
    -- 20 points per confirmed check-in (attendance)
    (COUNT(DISTINCT bt.id) FILTER (WHERE bt.checked_in = TRUE) * 20) as total_points,
    COUNT(DISTINCT b.id) as events_booked,
    COUNT(DISTINCT bt.id) FILTER (WHERE bt.checked_in = TRUE) as events_attended
FROM profiles p
LEFT JOIN bookings b ON p.id = b.user_id
LEFT JOIN booking_tickets bt ON b.id = bt.booking_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.email
ORDER BY total_points DESC;

-- Grant access to the view
GRANT SELECT ON student_leaderboard TO authenticated;
GRANT SELECT ON student_leaderboard TO anon;

-- Comment on badges logic (handled in frontend for MVP, but good to document)
-- Bronze: 0-100
-- Silver: 100-300
-- Gold: 300-500
-- Platinum: 500+
