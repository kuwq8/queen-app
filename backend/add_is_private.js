const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();

  try {
    await client.query(`ALTER TABLE communities ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;`);
    console.log("Added is_private to communities table.");
  } catch(e) {
    console.error(e);
  }
  await client.end();
}
run();
