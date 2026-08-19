const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function testTriggers() {
  await client.connect();
  try {
    const res = await client.query(`
      INSERT INTO comments (post_id, user_id, content) 
      VALUES ('f2d435e9-e641-4429-9763-c1755b95838a', '0abd761d-80a6-4e02-8e57-9aedaf12ab54', 'test')
      RETURNING *;
    `);
    console.log("Comment insert SUCCESS:", res.rows);
  } catch(e) {
    console.error("Comment insert ERROR:", e.message);
  }
  await client.end();
}
testTriggers();
