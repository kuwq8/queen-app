const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    console.log('Creating calls table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.calls (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'ringing', -- ringing, ongoing, ended, missed, rejected
        call_type TEXT DEFAULT 'audio', -- audio, video
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE
      );
    `);

    console.log('Enabling Row Level Security on calls...');
    await client.query(`ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;`);

    // Policies
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;
      CREATE POLICY "Users can view their own calls" ON public.calls 
      FOR SELECT USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
      
      DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
      CREATE POLICY "Users can create calls" ON public.calls 
      FOR INSERT WITH CHECK (auth.uid() = caller_id);
      
      DROP POLICY IF EXISTS "Users can update their calls" ON public.calls;
      CREATE POLICY "Users can update their calls" ON public.calls 
      FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
    `);

    await client.query(`
      GRANT ALL ON public.calls TO authenticated;
      GRANT ALL ON public.calls TO anon;
      GRANT ALL ON public.calls TO service_role;
    `);

    console.log('Setup complete!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
