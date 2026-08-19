const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function getTestUser() {
  const client = new Client({ connectionString });
  await client.connect();
  const res = await client.query('SELECT id FROM public.profiles LIMIT 2');
  console.log(res.rows);
  await client.end();
}
getTestUser();
