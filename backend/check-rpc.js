const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function checkRpc() {
  await client.connect();
  const res = await client.query(`SELECT prosrc FROM pg_proc WHERE proname IN ('increment_post_view', 'increment_post_views')`);
  console.log(res.rows);
  await client.end();
}
checkRpc();
