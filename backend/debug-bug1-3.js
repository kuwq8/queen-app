const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });

async function debug() {
  await client.connect();
  try {
    const u1 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'debug1_${Date.now()}@test.com') RETURNING id`);
    const u2 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'debug2_${Date.now()}@test.com') RETURNING id`);
    const user1 = u1.rows[0].id;
    const user2 = u2.rows[0].id;
    await new Promise(r => setTimeout(r, 1000));
    
    await client.query(`UPDATE public.profiles SET is_private = true WHERE id = $1`, [user1]);
    await client.query(`INSERT INTO public.posts (user_id, content) VALUES ($1, 'Private Post')`, [user1]);
    
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    const res = await client.query(`
      SELECT 
        auth.uid() as current_uid, 
        user_id as post_author,
        auth.uid() = user_id as cond1,
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = posts.user_id AND profiles.is_private = false) as cond2,
        EXISTS (SELECT 1 FROM follows WHERE follows.follower_id = auth.uid() AND follows.following_id = posts.user_id AND follows.status = 'accepted') as cond3
      FROM public.posts WHERE user_id = $1
    `, [user1]);
    console.log('Row evaluation:', res.rows[0]);

    await client.query(`RESET role;`);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [user1, user2]);
  } finally {
    await client.end();
  }
}
debug();
