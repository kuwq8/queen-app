const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function testTriggers() {
  await client.connect();
  const res = await client.query(`SELECT qual, with_check, policyname FROM pg_policies WHERE tablename = 'comments'`);
  console.log("Comments policies:", res.rows);
  const res2 = await client.query(`SELECT qual, with_check, policyname FROM pg_policies WHERE tablename = 'likes'`);
  console.log("Likes policies:", res2.rows);
  const res3 = await client.query(`SELECT qual, with_check, policyname FROM pg_policies WHERE tablename = 'reposts'`);
  console.log("Reposts policies:", res3.rows);
  await client.end();
}
testTriggers();
