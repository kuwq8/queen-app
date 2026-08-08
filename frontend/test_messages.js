const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('messages').select('sender_id').limit(1);
  console.log('Error:', error);
  console.log('Data:', data);
  const { data: d2, error: e2 } = await supabase.from('messages').select('user_id').limit(1);
  console.log('Error 2:', e2);
}
test();
