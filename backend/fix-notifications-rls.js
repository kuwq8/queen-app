const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixNotificationsRLS() {
  await client.connect();
  
  try {
    // Drop existing policies just in case
    await client.query(`DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON notifications;`);
    await client.query(`DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;`);
    await client.query(`DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;`);
    await client.query(`DROP POLICY IF EXISTS "Auth insert notifications" ON notifications;`);
    await client.query(`DROP POLICY IF EXISTS "Auth select notifications" ON notifications;`);
    await client.query(`DROP POLICY IF EXISTS "Auth update notifications" ON notifications;`);

    // Apply user's requested policies
    await client.query(`
      CREATE POLICY "Allow authenticated users to insert notifications"
      ON notifications FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
    `);

    await client.query(`
      CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
    `);

    await client.query(`
      CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
    `);

    console.log("Fixed notifications RLS successfully!");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

fixNotificationsRLS();
