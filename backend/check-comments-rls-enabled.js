const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(async () => {
  const res = await client.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = 'comments';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  client.end();
}).catch(console.error);
