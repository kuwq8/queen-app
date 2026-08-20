const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  const res = await client.query("SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'communities'");
  console.log(res.rows);
  await client.end();
}
run();
