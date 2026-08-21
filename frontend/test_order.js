const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
let env = fs.readFileSync('.env.local', 'utf8');
const u = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].trim();
const k = env.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=([^\r\n]+)/)[1].trim();
const supabase = createClient(u, k);

async function run() {
  const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            updated_at
          )
        `)
        .order('conversations(updated_at)', { ascending: false })
        .limit(1);
        
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
