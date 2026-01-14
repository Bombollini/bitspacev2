
import fs from 'fs';

// Simple .env parser
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Auth Endpoint:', url);

async function testAuth() {
    const authUrl = `${url}/auth/v1/token?grant_type=password`;
    console.log('Posting to:', authUrl);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpassword'
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
        
        if (res.status === 400 && data.error_description === 'Invalid login credentials') {
             console.log('SUCCESS: Auth API is reachable and responding correctly (Invalid Creds expected).');
        } else {
             console.log('Verify result manually.');
        }

    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

testAuth();
