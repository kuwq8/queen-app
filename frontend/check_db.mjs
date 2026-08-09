import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('messages').select('reply_to_message_id').limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else {
    console.log("Success! Column exists.");
  }
}

check();
