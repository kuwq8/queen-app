const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase
        .from('channels')
        .select(`
          id, name, slug,
          members:channel_members(
            user:profiles(id, username, avatar_url, bio)
          )
        `)
        .limit(1);
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
test();
