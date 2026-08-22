const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT *
    FROM public.notifications
    ORDER BY created_at DESC
    LIMIT 10;
  `);
  console.log(res.rows);
  await client.end();
}
check().catch(console.error);
