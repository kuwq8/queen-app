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
    const res = await client.query(`SELECT * FROM public.posts WHERE user_id = $1`, [user1]);
    console.log('Posts visible to user2:', res.rows.length);
    
    // Check if there's any other policy:
    const pols = await client.query(`SELECT policyname FROM pg_policies WHERE tablename = 'posts' AND cmd = 'SELECT'`);
    console.log('Select policies on posts:', pols.rows);
    
    // Clean up
    await client.query(`RESET role;`);
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [user1, user2]);
  } finally {
    await client.end();
  }
}
debug();
