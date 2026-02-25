
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxbjqejwestyvuyischu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmpxZWp3ZXN0eXZ1eWlzY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Njk0MzYsImV4cCI6MjA4MzI0NTQzNn0.dKwuMMNdAsrAk64zDGEr0-UK6ciR1mY28brJ1qunDY8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSubEvents() {
    console.log('Fetching a valid event...');
    const { data: events, error: eventError } = await supabase
        .from('events')
        .select('id')
        .limit(1);

    if (eventError || !events || events.length === 0) {
        console.log('Could not fetch events to test FK:', eventError);
        return;
    }

    const eventId = events[0].id;
    console.log('Using event ID:', eventId);

    const testSubEvent = {
        event_id: eventId,
        title: 'Test Sub Event',
        description: 'Debug Description',
        start_time: '10:00',
        end_time: '12:00',
        venue: 'Debug Venue',
        price: 0,
        total_seats: 50,
        requires_registration: false
    };

    console.log('Attempting to insert sub_event:', testSubEvent);

    const { data, error } = await supabase
        .from('sub_events')
        .insert([testSubEvent])
        .select();

    if (error) {
        console.log('Insert Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert Success:', data);
    }
}

debugSubEvents();
