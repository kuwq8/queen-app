require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function checkSchema() {
  const tables = ['messages', 'calls', 'call_signals', 'posts', 'comments', 'likes', 'follows'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}:`, data ? Object.keys(data[0] || {}).join(', ') : error.message);
  }
}

checkSchema();
