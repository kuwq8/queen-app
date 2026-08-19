const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`SELECT id, email, encrypted_password FROM auth.users WHERE email = 'testuser_e2e@example.com'`);
    console.log('User:', res.rows);
    
    if (res.rows.length > 0) {
      const pRes = await client.query(`SELECT * FROM public.profiles WHERE id = $1`, [res.rows[0].id]);
      console.log('Profile:', pRes.rows);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
