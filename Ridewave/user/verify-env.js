// Quick script to verify .env file is being read
// Run: node verify-env.js

require('dotenv/config');

console.log('\n🔍 Environment Variables Check:\n');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');

if (process.env.EXPO_PUBLIC_SUPABASE_URL) {
  console.log('\nURL Value:', process.env.EXPO_PUBLIC_SUPABASE_URL.substring(0, 30) + '...');
}
if (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Key Value:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30) + '...');
}

console.log('\n');

