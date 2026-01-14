
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

console.log('Initializing Supabase Client (Persistence: ON)');
console.log('Supabase URL:', supabaseUrl ? supabaseUrl.trim() : 'MISSING');
console.log('Supabase Key provided:', supabaseAnonKey ? 'YES' : 'NO');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
