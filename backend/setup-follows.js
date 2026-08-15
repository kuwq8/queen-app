const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // 1. Create follows table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.follows (
        follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      );
    `);
    console.log('Created follows table');

    // 2. Add count columns to profiles
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
    `);
    console.log('Added count columns to profiles');

    // 3. Create triggers to update counts
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_follow_counts()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.profiles SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
          UPDATE public.profiles SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.profiles SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
          UPDATE public.profiles SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS update_profile_follow_counts ON public.follows;
      CREATE TRIGGER update_profile_follow_counts
      AFTER INSERT OR DELETE ON public.follows
      FOR EACH ROW EXECUTE FUNCTION public.update_follow_counts();
    `);
    console.log('Created follow triggers');

    // 4. Grant privileges
    await client.query(`
      GRANT ALL ON TABLE public.follows TO anon, authenticated;
    `);
    console.log('Granted privileges on follows');

    // 5. Backfill counts
    await client.query(`
      UPDATE public.profiles p
      SET 
        followers_count = (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = p.id),
        following_count = (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = p.id);
    `);
    console.log('Backfilled follower counts');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
