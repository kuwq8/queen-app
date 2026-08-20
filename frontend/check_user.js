const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT * FROM profiles WHERE username = 'kaka345ka'");
  console.log('kaka345ka exists:', res.rowCount > 0);
  await client.end();
}
run();
