const {Client} = require('pg');

async function checkRLS() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();

  const tables = [
    'profiles', 'follows', 'messages', 'calls', 'call_signals', 
    'posts', 'comments', 'likes', 'Post', 'User', 'Comment', 'Follows', 'Like'
  ];

  for (const t of tables) {
    const {rows: rlsStatus} = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = '${t}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    const {rows: policies} = await client.query(`
      SELECT polname, polcmd, polroles, polqual, polwithcheck 
      FROM pg_policy 
      WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = '${t}' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
    `);
    
    console.log(`\n=== Table: ${t} ===`);
    console.log(`RLS Enabled: ${rlsStatus.length > 0 ? rlsStatus[0].relrowsecurity : 'NOT FOUND'}`);
    if (policies.length === 0) {
      console.log(`Policies: NONE (Default Deny if RLS enabled)`);
    } else {
      policies.forEach(p => {
        console.log(` - [${p.polcmd}] ${p.polname}`);
        if (p.polqual) console.log(`   USING (${p.polqual})`);
        if (p.polwithcheck) console.log(`   WITH CHECK (${p.polwithcheck})`);
      });
    }
  }

  console.log(`\n=== Storage Objects ===`);
  const {rows: storagePol} = await client.query(`
      SELECT polname, polcmd, polqual, polwithcheck 
      FROM pg_policy 
      WHERE polrelid = (SELECT pg_class.oid FROM pg_class JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid WHERE relname = 'objects' AND nspname = 'storage')
  `);
  storagePol.forEach(p => {
    console.log(` - [${p.polcmd}] ${p.polname}`);
  });

  await client.end();
}

checkRLS().catch(console.error);
