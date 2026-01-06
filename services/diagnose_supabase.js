
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://csnaxyaqhpzrlbrftgqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmF4eWFxaHB6cmxicmZ0Z3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDI4NjIsImV4cCI6MjA4MzI3ODg2Mn0.Q4yylr_zEjBWVitHpXZYB4_ZJ3NXZOHwDkXMAyyeL8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to:', supabaseUrl);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
  );

  try {
    const start = Date.now();
    console.log('Fetching Profiles...');
    const { data: profiles, error } = await Promise.race([
      supabase.from('profiles').select('id, email'),
      timeoutPromise
    ]);
    
    if (error) {
        console.error('Error fetching profiles:', error);
        writeFileSync('diagnose_output.txt', 'Error: ' + JSON.stringify(error));
    } else {
        console.log('Profiles found:', profiles?.length);
        const output = profiles?.map(p => JSON.stringify(p)).join('\n');
        writeFileSync('diagnose_output.txt', 'Profiles:\n' + output);
    }

    console.log('Connection SUCCESS! Took', Date.now() - start, 'ms');
  } catch (err) {
    console.error('Connection FAILED:', err.message);
  }
}

testConnection();
