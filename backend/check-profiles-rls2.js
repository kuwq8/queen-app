const {Client} = require('pg'); 
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(() => 
  client.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('profiles', 'users')")
).then(res => {
  console.log(res.rows); 
  client.end();
});
