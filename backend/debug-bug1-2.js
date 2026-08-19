const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });

async function debug() {
  await client.connect();
  try {
    const u1 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'debug1_${Date.now()}@test.com') RETURNING id`);
    const user1 = u1.rows[0].id;
    await new Promise(r => setTimeout(r, 1000)); // wait for trigger
    
    // Check initial state
    let prof = await client.query(`SELECT is_private FROM public.profiles WHERE id = $1`, [user1]);
    console.log('Initial profile:', prof.rows[0]);
    
    await client.query(`UPDATE public.profiles SET is_private = true WHERE id = $1`, [user1]);
    
    prof = await client.query(`SELECT is_private FROM public.profiles WHERE id = $1`, [user1]);
    console.log('After update profile:', prof.rows[0]);

    await client.query(`DELETE FROM auth.users WHERE id = $1`, [user1]);
  } finally {
    await client.end();
  }
}
debug();
