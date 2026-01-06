
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csnaxyaqhpzrlbrftgqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmF4eWFxaHB6cmxicmZ0Z3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDI4NjIsImV4cCI6MjA4MzI3ODg2Mn0.Q4yylr_zEjBWVitHpXZYB4_ZJ3NXZOHwDkXMAyyeL8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('Authenticating...');
  const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'rizhanmunra@gmail.com',
    password: 'rizhanmunra123'
  });

  if (loginError) {
      console.error('Login failed:', loginError.message);
      return;
  }
  console.log('Login success, user:', session.user.id);

  console.log('Fetching raw activities...');

  // 1. Fetch raw activities without joining
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching activities:', error);
    return;
  }

  console.log('\n--- Recent Activities (Raw) ---');
  console.log(JSON.stringify(data, null, 2));

  if (data.length > 0) {
      // 2. Check if we can fetch the user for the first activity
      const firstActivity = data[0];
      if (firstActivity.user_id) {
          console.log(`\nChecking user for ID: ${firstActivity.user_id}`);
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', firstActivity.user_id)
            .single();
          
          if (userError) {
              console.error('Error fetching user:', userError);
          } else {
              console.log('User found:', userData);
          }
      } else {
          console.log('First activity has NO user_id!');
      }
  }
}

diagnose();
