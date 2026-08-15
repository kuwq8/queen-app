require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: posts } = await supabase.from('posts').select('id, likes_count').limit(1);
  if (!posts || posts.length === 0) {
    console.log("No posts");
    return;
  }
  const post = posts[0];
  console.log("Before: ", post);

  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  const user = users[0];

  const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
  console.log("Insert Error: ", error);

  const { data: postsAfter } = await supabase.from('posts').select('id, likes_count').eq('id', post.id);
  console.log("After: ", postsAfter[0]);
  
  await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
}
test();
