const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function enableRealtime() {
  await client.connect();
  try {
    await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE comments;`);
    console.log("Realtime enabled for comments");
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
enableRealtime();
