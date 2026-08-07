const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);
async function test() {
  const { data, error } = await supabase.from('channel_members').update({ role: 'owner' }).eq('channel_id', 'f3f76281-fd01-422e-b7dd-9a33817dd100').eq('user_id', '0abd761d-80a6-4e02-8e57-9aedaf12ab54');
  console.log('Update Error:', error);
  console.log('Update Data:', data);
}
test();
