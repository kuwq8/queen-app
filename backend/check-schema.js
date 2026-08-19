const {Client} = require('pg'); 
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(() => 
  Promise.all(['profiles', 'follows'].map(t => client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t}'`)))
).then(res => {
  console.log(JSON.stringify(res.map(r => r.rows), null, 2)); 
  client.end();
});
