const {Client} = require('pg'); 
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(() => 
  client.query("SELECT p.polname, p.polcmd, pg_get_expr(p.polqual, p.polrelid) as USING_clause, pg_get_expr(p.polwithcheck, p.polrelid) as WITH_CHECK FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid WHERE c.relname = 'profiles'")
).then(res => {
  console.log(res.rows); 
  client.end();
});
