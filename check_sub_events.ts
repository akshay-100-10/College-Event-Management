
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxbjqejwestyvuyischu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmpxZWp3ZXN0eXZ1eWlzY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Njk0MzYsImV4cCI6MjA4MzI0NTQzNn0.dKwuMMNdAsrAk64zDGEr0-UK6ciR1mY28brJ1qunDY8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubEvents() {
    console.log('Fetching sub_events structure...');

    // Try to insert a dummy row that we know will fail constraints but might give us column info in error, 
    // or just select to see if we can get data.

    // Better: try to insert a row with minimal columns to see what's required.
    // Actually, let's just inspect an existing one if any.

    const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error fetching:', error);
    } else {
        if (data.length > 0) {
            console.log('Existing sub_event keys:', Object.keys(data[0]));
            console.log('Sample data:', data[0]);
        } else {
            console.log('No sub_events found. Trying to insert a test one to check columns...');
            // We need a valid event_id. This is hard without a known event.
            console.log('Cannot infer schema without data. Please check SQL definition.');
        }
    }
}

checkSubEvents();
