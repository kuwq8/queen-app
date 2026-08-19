
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function setup() {
  await client.connect();
  
  try {
    console.log('Creating communities table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.communities (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        avatar_url TEXT,
        cover_url TEXT,
        creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        members_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Creating community_members table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.community_members (
        community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (community_id, user_id)
      );
    `);

    console.log('Modifying posts table to add community_id...');
    // Add column if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema='public' AND table_name='posts' AND column_name='community_id'
        ) THEN
          ALTER TABLE public.posts ADD COLUMN community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    console.log('Enabling Row Level Security...');
    
    // Enable RLS
    await client.query(`ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;`);

    // Communities RLS
    await client.query(`
      DROP POLICY IF EXISTS "Communities are viewable by everyone." ON public.communities;
      CREATE POLICY "Communities are viewable by everyone." ON public.communities FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Users can create communities." ON public.communities;
      CREATE POLICY "Users can create communities." ON public.communities FOR INSERT WITH CHECK (auth.uid() = creator_id);
      
      DROP POLICY IF EXISTS "Creators can update their communities." ON public.communities;
      CREATE POLICY "Creators can update their communities." ON public.communities FOR UPDATE USING (auth.uid() = creator_id);
    `);

    // Community Members RLS
    await client.query(`
      DROP POLICY IF EXISTS "Community members are viewable by everyone." ON public.community_members;
      CREATE POLICY "Community members are viewable by everyone." ON public.community_members FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Users can join communities." ON public.community_members;
      CREATE POLICY "Users can join communities." ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can leave communities." ON public.community_members;
      CREATE POLICY "Users can leave communities." ON public.community_members FOR DELETE USING (auth.uid() = user_id);
    `);

    // Grant access to authenticated users
    await client.query(`
      GRANT ALL ON public.communities TO authenticated;
      GRANT ALL ON public.communities TO anon;
      GRANT ALL ON public.communities TO service_role;
      
      GRANT ALL ON public.community_members TO authenticated;
      GRANT ALL ON public.community_members TO anon;
      GRANT ALL ON public.community_members TO service_role;
    `);

    // Add triggers to auto-update members_count (optional, but good for accuracy)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_community_members_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE public.communities SET members_count = members_count + 1 WHERE id = NEW.community_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.communities SET members_count = members_count - 1 WHERE id = OLD.community_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS community_members_count_trigger ON public.community_members;
      CREATE TRIGGER community_members_count_trigger
      AFTER INSERT OR DELETE ON public.community_members
      FOR EACH ROW EXECUTE FUNCTION update_community_members_count();
    `);

    console.log('Setup complete!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

setup();
