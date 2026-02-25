import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Hardcoding for now to avoid Expo env setup complexity in the first pass
// Ideally should use env variables
const supabaseUrl = 'https://yckpbghiykykhuppncjy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlja3BiZ2hpeWt5a2h1cHBuY2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjUxMjEsImV4cCI6MjA4Mzk0MTEyMX0.SLAnof1zZ9Kxka6H-P9ed5-DtHnHm_wTeNd21THhPHY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
