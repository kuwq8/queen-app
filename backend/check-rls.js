const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkRLS() {
  await client.connect();
  const res = await client.query(`SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('likes', 'reposts', 'comments', 'posts')`);
  console.log(res.rows);
  await client.end();
}
checkRLS();
