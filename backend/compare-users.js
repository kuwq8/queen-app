const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT *
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 2;
    `);
    console.log('Latest 2 users in auth.users:');
    res.rows.forEach(r => console.log(r));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
