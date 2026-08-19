const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query(`DELETE FROM public."User" WHERE email LIKE 'testuser%@example.com'`);
    await client.query(`DELETE FROM public.profiles WHERE username LIKE 'testuser%'`);
    await client.query(`DELETE FROM auth.users WHERE email LIKE 'testuser%@example.com'`);
    console.log('Test users cleaned up everywhere.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
