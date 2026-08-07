const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('channel_members').select('*').eq('channel_id', 'f3f76281-fd01-422e-b7dd-9a33817dd100');
  console.log('Error:', error);
  console.log('Members:', data);
  
  const { data: profile } = await supabase.from('profiles').select('username, id, role');
  console.log('Profiles:', profile);
}
test();
