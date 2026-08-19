const {Client} = require('pg');
const client = new Client('postgresql://postgres.pntvsvntrftzowfdbjca:9iQ7p5N6x3Z2w1V0@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres');
client.connect()
  .then(() => client.query("SELECT polname, polcmd FROM pg_policy JOIN pg_class ON pg_class.oid = pg_policy.polrelid WHERE relname = 'comments'"))
  .then(res => {
    console.log("POLICIES:");
    console.log(res.rows);
    client.end();
  })
  .catch(console.error);
