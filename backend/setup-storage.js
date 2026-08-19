const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    console.log('Setting up storage buckets...');
    
    // Ensure storage schema is available, but usually it is in Supabase.
    // Insert avatars bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true) 
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert covers bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('covers', 'covers', true) 
      ON CONFLICT (id) DO NOTHING;
    `);

    // Policies for avatars
    await client.query(`
      DROP POLICY IF EXISTS "Public avatars" ON storage.objects;
      CREATE POLICY "Public avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
      
      DROP POLICY IF EXISTS "Auth insert avatars" ON storage.objects;
      CREATE POLICY "Auth insert avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
      
      DROP POLICY IF EXISTS "Auth update avatars" ON storage.objects;
      CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);
    `);

    // Policies for covers
    await client.query(`
      DROP POLICY IF EXISTS "Public covers" ON storage.objects;
      CREATE POLICY "Public covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
      
      DROP POLICY IF EXISTS "Auth insert covers" ON storage.objects;
      CREATE POLICY "Auth insert covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid() = owner);
      
      DROP POLICY IF EXISTS "Auth update covers" ON storage.objects;
      CREATE POLICY "Auth update covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid() = owner);
    `);

    console.log('Storage setup complete!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
