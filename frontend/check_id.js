const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT id, name, creator_id FROM communities WHERE id = 'd5f61c2d-56bf-46c5-9a60-16dfbf230fde'");
  console.log(res.rows);
  await client.end();
}
run();
