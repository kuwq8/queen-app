const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT prosrc 
      FROM pg_proc 
      WHERE proname = 'handle_new_user';
    `);
    console.log('handle_new_user definition:');
    console.log(res.rows[0].prosrc);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
