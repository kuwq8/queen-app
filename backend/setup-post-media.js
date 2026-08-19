const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    console.log('Setting up post_media bucket...');
    
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('post_media', 'post_media', true) 
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Public post_media" ON storage.objects;
      CREATE POLICY "Public post_media" ON storage.objects FOR SELECT USING (bucket_id = 'post_media');
      
      DROP POLICY IF EXISTS "Auth insert post_media" ON storage.objects;
      CREATE POLICY "Auth insert post_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post_media' AND auth.uid() = owner);
      
      DROP POLICY IF EXISTS "Auth update post_media" ON storage.objects;
      CREATE POLICY "Auth update post_media" ON storage.objects FOR UPDATE USING (bucket_id = 'post_media' AND auth.uid() = owner);
      
      DROP POLICY IF EXISTS "Auth delete post_media" ON storage.objects;
      CREATE POLICY "Auth delete post_media" ON storage.objects FOR DELETE USING (bucket_id = 'post_media' AND auth.uid() = owner);
    `);

    console.log('Storage setup complete!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
