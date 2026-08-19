const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    const res = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth';
    `);
    console.log('Triggers in auth schema:');
    console.log(res.rows);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
