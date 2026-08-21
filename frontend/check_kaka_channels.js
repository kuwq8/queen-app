const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT id, name, creator_id FROM communities WHERE creator_id = '0abd761d-80a6-4e02-8e57-9aedaf12ab54'");
  console.log(res.rows);
  await client.end();
}
run();
