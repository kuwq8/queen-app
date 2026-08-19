const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });

async function debug() {
  await client.connect();
  const res = await client.query("SELECT relrowsecurity FROM pg_class WHERE relname = 'posts';");
  console.log('posts RLS enabled:', res.rows[0]);
  await client.end();
}
debug();
