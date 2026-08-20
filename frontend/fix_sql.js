const { Client } = require('pg');

async function run() {
  const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    const sql = `
ALTER TABLE comments 
DROP CONSTRAINT IF EXISTS fk_comments_profiles,
ADD CONSTRAINT fk_comments_profiles 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
    `;
    await client.query(sql);
    console.log('SQL executed successfully!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
