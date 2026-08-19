const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function checkStorage() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const bucketsRes = await client.query(`SELECT id, name, public FROM storage.buckets;`);
    console.log('Buckets:', bucketsRes.rows);

    const policiesRes = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects';
    `);
    console.log('Storage Objects Policies:', policiesRes.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

checkStorage();
