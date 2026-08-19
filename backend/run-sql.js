const fs = require('fs');
const {Client} = require('pg'); 
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(() => {
  const sql = fs.readFileSync('backend/fix-triggers.sql', 'utf8');
  return client.query(sql);
}).then(res => {
  console.log("SQL executed successfully."); 
  client.end();
}).catch(err => {
  console.error("SQL Error:", err);
  client.end();
});
