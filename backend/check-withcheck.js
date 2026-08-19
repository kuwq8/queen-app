const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function listPolicies() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as qual, pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check
    FROM pg_policy pol
    JOIN pg_class tbl ON tbl.oid = pol.polrelid
    WHERE tbl.relname IN ('conversation_participants', 'messages')
  `);
  
  console.log(res.rows);
  await client.end();
}

listPolicies();
