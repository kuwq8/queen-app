const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT routine_definition
    FROM information_schema.routines
    WHERE routine_name = 'notify_comment';
  `);
  console.log(res.rows[0].routine_definition);
  await client.end();
}
check().catch(console.error);
