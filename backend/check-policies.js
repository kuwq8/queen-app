const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function listPolicies() {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as qual
    FROM pg_policy pol
    JOIN pg_class tbl ON tbl.oid = pol.polrelid
    WHERE tbl.relname = 'conversation_participants'
  `);
  
  console.log('conversation_participants policies:');
  console.log(res.rows);

  const res2 = await client.query(`
    SELECT pol.polname, pol.polcmd, pg_get_expr(pol.polqual, pol.polrelid) as qual
    FROM pg_policy pol
    JOIN pg_class tbl ON tbl.oid = pol.polrelid
    WHERE tbl.relname = 'messages'
  `);
  
  console.log('\\nmessages policies:');
  console.log(res2.rows);

  await client.end();
}

listPolicies();
