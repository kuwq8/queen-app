const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(async () => {
  const res = await client.query(`
    SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck
    FROM pg_policy pol
    JOIN pg_class cls ON pol.polrelid = cls.oid
    WHERE cls.relname = 'comments';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(console.error);
