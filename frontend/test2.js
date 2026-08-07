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
          id,
          participants:channel_members(
            user:profiles!channel_members_user_id_fkey(id, username, avatar_url)
          ),
          messages(
            sender:profiles!messages_sender_id_fkey(id, username)
          )
        `)
        .limit(1);
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : null);
}
test();
