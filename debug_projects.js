
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env manual
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

async function run() {
    console.log("1. Attempting login...");
    // We need to login as a user to test RLS. 
    // I'll assume we use the credentials of a known user or ask user to provide, 
    // but for now let's try to just hit the public endpoint or check if we can get projects without auth (should fail but invalid result, not timeout)
    // Actually, RLS applies to authenticated users usually.
    // Let's try to login with a hardcoded test user if we knew one, but I don't.
    // I'll check if I can 'select count from projects'.
    
    // START TIMEOUT CHECK
    const timeout = setTimeout(() => {
        console.error("TIMEOUT REACHED (10s)! It is likely hanging.");
        process.exit(1);
    }, 10000);

    const start = Date.now();
    try {
        console.log("2. Fetching projects (Simulating api.projects.list)...");
        // Note: Without auth, this returns empty array if RLS works, or error. 
        // If it hangs, it means even public/anon access triggers recursion (bad policies).
        const { data, error } = await supabase
            .from('projects')
            .select(`*, tasks:tasks(id, status)`);
            
        console.log("3. Result received!");
        console.log("Time taken:", Date.now() - start, "ms");
        if (error) console.error("Error:", error);
        else console.log("Data length:", data.length);

    } catch (e) {
        console.error("Exception:", e);
    } finally {
        clearTimeout(timeout);
    }
}

run();
