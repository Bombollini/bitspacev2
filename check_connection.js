
import https from 'https';

const url = 'https://csnaxyaqhpzrlbrftgqt.supabase.co';

console.log(`Testing connection to ${url}...`);

const req = https.get(url, (res) => {
  console.log(`StatusCode: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  res.on('data', (d) => {
    // consume data
  });
  res.on('end', () => {
    console.log('Response ended. Connection successful.');
  });
});

req.on('error', (e) => {
  console.error(`Connection error: ${e.message}`);
  if (e.cause) {
      console.error('Cause:', e.cause);
  }
});

req.end();
