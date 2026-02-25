
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sxbjqejwestyvuyischu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmpxZWp3ZXN0eXZ1eWlzY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Njk0MzYsImV4cCI6MjA4MzI0NTQzNn0.dKwuMMNdAsrAk64zDGEr0-UK6ciR1mY28brJ1qunDY8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvent() {
    const eventId = 'f034eece-37d6-4d67-93e9-ce98faa4339f';
    console.log(`Fetching details for event: ${eventId}`);

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error) {
        console.log('Error fetching event:', error);
    } else {
        console.log('Event Details:');
        console.log('Title:', data.title);
        console.log('Venue:', data.venue);
        console.log('Location:', data.location);
        console.log('-----------------------------------');
        console.log('Search Query likely used:', `${data.venue}, ${data.location}`);
    }
}

checkEvent();
