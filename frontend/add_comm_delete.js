const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();
  await client.query("CREATE POLICY \"Creators can delete their communities.\" ON communities FOR DELETE USING (auth.uid() = creator_id);");
  console.log("Added DELETE policy");
  await client.end();
}
run();
