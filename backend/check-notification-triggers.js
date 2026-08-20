const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixNotificationTriggers() {
  await client.connect();
  
  try {
    const res = await client.query(`
      SELECT p.proname, p.prosrc 
      FROM pg_proc p 
      JOIN pg_trigger t ON t.tgfoid = p.oid 
      WHERE t.tgname IN ('trigger_notify_like', 'trigger_notify_comment', 'trigger_notify_repost', 'trigger_notify_follow', 'trigger_notify_message')
    `);
    console.log(res.rows);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

fixNotificationTriggers();
