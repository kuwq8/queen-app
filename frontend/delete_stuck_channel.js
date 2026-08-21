const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  await client.query("DELETE FROM communities WHERE id = '73818075-e7a8-434f-b3c1-a81c3325d7d1'");
  console.log("Deleted channel ات");
  await client.end();
}
run();
