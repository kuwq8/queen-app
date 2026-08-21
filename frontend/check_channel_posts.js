const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT id, content, user_id FROM posts WHERE community_id = '73818075-e7a8-434f-b3c1-a81c3325d7d1'");
  console.log(res.rows);
  await client.end();
}
run();
