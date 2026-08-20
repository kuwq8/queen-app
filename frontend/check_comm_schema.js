const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'communities'");
  console.log(res.rows.map(r => r.column_name));
  await client.end();
}
run();
