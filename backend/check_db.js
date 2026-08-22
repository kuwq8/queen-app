const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function check() {
  await client.connect();
  
  // Triggers
  const res = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE event_object_table IN ('comments', 'likes', 'follows', 'reposts');
  `);
  console.log("Triggers:", res.rows);
  
  // Realtime publications
  const res2 = await client.query(`
    SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  `);
  console.log("Realtime tables:", res2.rows);

  await client.end();
}
check().catch(console.error);
