const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function setupFixes() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('1. NOTIFICATIONS INSERT SECURITY');
    // Drop the problematic policy
    await client.query(`DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;`);
    // Ensure normal users cannot insert. We just leave it without an INSERT policy for public/authenticated,
    // meaning RLS will deny inserts by default. Triggers bypass RLS.
    
    console.log('2. PREMIUM SECURITY');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.prevent_premium_update() RETURNS TRIGGER AS $$
      BEGIN
        -- If current role is anon or authenticated, deny is_premium changes
        IF current_setting('role') IN ('authenticated', 'anon') THEN
          IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
            RAISE EXCEPTION 'Unauthorized: Clients cannot modify is_premium';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS prevent_premium_update_trigger ON public.profiles;
      CREATE TRIGGER prevent_premium_update_trigger
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.prevent_premium_update();
    `);

    // Let's also check if subscriptions table exists and secure it.
    await client.query(`
      CREATE OR REPLACE FUNCTION public.prevent_subscription_update() RETURNS TRIGGER AS $$
      BEGIN
        IF current_setting('role') IN ('authenticated', 'anon') THEN
          RAISE EXCEPTION 'Unauthorized: Clients cannot modify subscriptions directly';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    const subsCheck = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions'`);
    if (subsCheck.rows.length > 0) {
      await client.query(`
        DROP TRIGGER IF EXISTS prevent_subscription_update_trigger ON public.subscriptions;
        CREATE TRIGGER prevent_subscription_update_trigger
        BEFORE UPDATE OR INSERT ON public.subscriptions
        FOR EACH ROW EXECUTE FUNCTION public.prevent_subscription_update();
      `);
    }

    console.log('3. STORAGE SECURITY');
    const buckets = ['avatars', 'covers', 'media', 'private_media'];
    for (const b of buckets) {
      // Delete old policies that are too permissive or use `with_check` in ways we want to tighten
      await client.query(`DROP POLICY IF EXISTS "Auth insert ${b}" ON storage.objects;`);
      await client.query(`DROP POLICY IF EXISTS "Auth update ${b}" ON storage.objects;`);
      await client.query(`DROP POLICY IF EXISTS "Auth delete ${b}" ON storage.objects;`);
      await client.query(`DROP POLICY IF EXISTS "Public ${b}" ON storage.objects;`);
      await client.query(`DROP POLICY IF EXISTS "Public ${b} access" ON storage.objects;`);
      
      // Select
      if (b !== 'private_media') {
        await client.query(`
          CREATE POLICY "Public select ${b}" ON storage.objects FOR SELECT USING (bucket_id = '${b}');
        `);
      } else {
        await client.query(`
          CREATE POLICY "Owner select ${b}" ON storage.objects FOR SELECT USING (bucket_id = '${b}' AND owner = auth.uid());
        `);
      }
      
      // Insert: Enforce auth.uid() in the path, and owner = auth.uid()
      await client.query(`
        CREATE POLICY "Owner insert ${b}" ON storage.objects FOR INSERT WITH CHECK (
          bucket_id = '${b}' 
          AND owner = auth.uid() 
          AND split_part(name, '/', 1) = auth.uid()::text
        );
      `);
      
      // Update
      await client.query(`
        CREATE POLICY "Owner update ${b}" ON storage.objects FOR UPDATE USING (
          bucket_id = '${b}' AND owner = auth.uid()
        );
      `);
      
      // Delete
      await client.query(`
        CREATE POLICY "Owner delete ${b}" ON storage.objects FOR DELETE USING (
          bucket_id = '${b}' AND owner = auth.uid()
        );
      `);
    }

    console.log('4. WEBRTC CALL SIGNALS');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.call_signals (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        event TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    await client.query(`ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;`);
    await client.query(`DROP POLICY IF EXISTS "Users can access signals for their calls" ON public.call_signals;`);
    await client.query(`
      CREATE POLICY "Users can access signals for their calls" ON public.call_signals
      FOR ALL USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
      WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
    `);
    
    // We should also enforce sender_id = auth.uid() on INSERT to prevent spoofing
    await client.query(`DROP POLICY IF EXISTS "Users can insert signals" ON public.call_signals;`);
    await client.query(`
      CREATE POLICY "Users can insert signals" ON public.call_signals
      FOR INSERT WITH CHECK (auth.uid() = sender_id AND (auth.uid() = sender_id OR auth.uid() = receiver_id));
    `);
    // Need to make sure the SELECT policy allows them to read their signals
    await client.query(`DROP POLICY IF EXISTS "Users can read signals" ON public.call_signals;`);
    await client.query(`
      CREATE POLICY "Users can read signals" ON public.call_signals
      FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    `);

    // Grant access
    await client.query(`GRANT ALL ON TABLE public.call_signals TO anon, authenticated;`);

    console.log('Done Phase 1 DB setups.');

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

setupFixes();
