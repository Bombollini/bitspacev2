
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = 'https://csnaxyaqhpzrlbrftgqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzbmF4eWFxaHB6cmxicmZ0Z3F0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDI4NjIsImV4cCI6MjA4MzI3ODg2Mn0.Q4yylr_zEjBWVitHpXZYB4_ZJ3NXZOHwDkXMAyyeL8o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('Fetching RLS Policies...');
  
  // We cannot query pg_policies directly via client unless we call a function.
  // Standard client only sees public tables.
  // Instead, let's try to perform an INSERT that we EXPECT to work with the permissive policy
  // using a test user.
  
  // Actually, we can just ask the user. But let's try to insert a dummy project with a random UUID owner
  // If we can't create a user easily, we can't really test RLS from here without a valid session.
  
  console.log('Skipping direct policy check (requires SQL access).');
  console.log('Checking Auth Status via node...');
  
  /*
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'admin@user1.com', 
    password: 'password'
  });
  */
  
  /*
  // Create a fresh test user to guarantee access
  const email = `test.user.${Date.now()}@gmail.com`;
  const password = 'password123';
  
  console.log('Creating test user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  ...
  */
 
  // USE KNOWN CREDENTIALS
  console.log('Attempting login with known credentials...');
  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email: 'rizhanmunra@gmail.com', 
    password: 'rizhanmunra123'
  });

  if (error) {
       console.error('Login Failed:', error.message);
       return;
  }
  
  console.log('Login Success. User ID:', session.user.id);
  
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert({
        name: 'Diagnostic Project Node',
        description: 'Testing RLS from Node',
        owner_id: session.user.id
    })
    .select()
    .single();

  if (insertError) {
      console.error('INSERT FAILED (RLS Issue Confirmed):', JSON.stringify(insertError));
      writeFileSync('rls_output.txt', 'INSERT FAILED: ' + JSON.stringify(insertError));
  } else {
      console.log('INSERT SUCCESS:', project);
      writeFileSync('rls_output.txt', 'INSERT SUCCESS: ' + JSON.stringify(project));
      
      // Cleanup
      await supabase.from('projects').delete().eq('id', project.id);
  }
}

diagnose();
