require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: comments, error } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_user_id_fkey(id, username, avatar_url)')
        .limit(1);
  console.log("Comments:", JSON.stringify(comments, null, 2));
  console.log("Error:", error);
}
test();
