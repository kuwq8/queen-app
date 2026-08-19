const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function listColumns() {
  const client = new Client({ connectionString });
  await client.connect();

  const tables = ['messages', 'call_signals', 'posts', 'comments', 'likes', 'follows'];
  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 AND table_schema = 'public'
    `, [table]);
    
    console.log(`Table: ${table}`);
    res.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
  }
  
  await client.end();
}

listColumns();
