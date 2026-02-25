
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sxbjqejwestyvuyischu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YmpxZWp3ZXN0eXZ1eWlzY2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2Njk0MzYsImV4cCI6MjA4MzI0NTQzNn0.dKwuMMNdAsrAk64zDGEr0-UK6ciR1mY28brJ1qunDY8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const email = 'christ3@gmail.com';
    console.log(`Checking profile for ${email}...`);

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
    } else if (data) {
        console.log('Profile found:', data);
    } else {
        console.log('No profile found for this email.');
    }
}

checkProfile();
