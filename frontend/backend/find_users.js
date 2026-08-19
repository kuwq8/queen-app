require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase.from('profiles').select('username, id').limit(5);
  console.log("Users:", data);
  console.log("Error:", error);
}

checkUsers();
