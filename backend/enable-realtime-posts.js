const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function enableRealtimePosts() {
  await client.connect();
  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE posts;`);
    console.log("Realtime enabled for posts");
  } catch(e) {
    if (e.message.includes('already in publication')) {
       console.log("Already enabled");
    } else {
       console.error("Error:", e.message);
    }
  } finally {
    await client.end();
  }
}
enableRealtimePosts();
