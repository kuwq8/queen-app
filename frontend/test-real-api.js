require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function test() {
  console.log('Testing with real Supabase Client');
  // create users
  const email1 = `test_qa1_${Math.floor(Math.random()*10000)}@gmail.com`;
  const email2 = `test_qa2_${Math.floor(Math.random()*10000)}@gmail.com`;
  
  const { data: u1, error: e1 } = await supabase.auth.signUp({ email: email1, password: 'password' });
  if (e1) throw e1;
  
  // Create another client for u2 to isolate session
  const supabase2 = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const { data: u2, error: e2 } = await supabase2.auth.signUp({ email: email2, password: 'password' });
  if (e2) throw e2;
  
  const user1 = u1.user.id;
  const user2 = u2.user.id;
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Set user1 to private
  await supabase.from('profiles').update({ is_private: true }).eq('id', user1);
  // user1 creates post
  await supabase.from('posts').insert({ user_id: user1, content: 'Secret post' });
  
  // user2 tries to read
  const { data: posts } = await supabase2.from('posts').select('*').eq('user_id', user1);
  console.log('Posts visible to user2 (non-follower):', posts?.length);
  
  // user2 follows user1 (should be pending)
  const { data: follow } = await supabase2.from('follows').insert({ follower_id: user2, following_id: user1 }).select().single();
  console.log('Follow status:', follow?.status);
  
  // user2 tries to read again
  const { data: posts2 } = await supabase2.from('posts').select('*').eq('user_id', user1);
  console.log('Posts visible to user2 (pending):', posts2?.length);
  
  // user1 accepts
  await supabase.from('follows').update({ status: 'accepted' }).eq('follower_id', user2).eq('following_id', user1);
  
  // user2 tries to read again
  const { data: posts3 } = await supabase2.from('posts').select('*').eq('user_id', user1);
  console.log('Posts visible to user2 (accepted):', posts3?.length);
}

test().catch(console.error);
