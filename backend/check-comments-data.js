const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
client.connect().then(async () => {
  try {
    const res = await client.query(`
      SELECT p.id, c.id as comment_id
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      ORDER BY p.created_at DESC LIMIT 5;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    client.end();
  }
});
