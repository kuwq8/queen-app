const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    // Check tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('likes', 'reposts', 'comments', 'bookmarks');
    `);
    console.log('Interaction Tables:', res.rows.map(r => r.table_name));

    // Create tables if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
      
      CREATE TABLE IF NOT EXISTS public.reposts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS public.comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.bookmarks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
    `);
    console.log('Ensured tables exist.');

    // Create functions and triggers for counts
    await client.query(`
      -- Likes Trigger
      CREATE OR REPLACE FUNCTION update_likes_count() RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS likes_count_trigger ON public.likes;
      CREATE TRIGGER likes_count_trigger
      AFTER INSERT OR DELETE ON public.likes
      FOR EACH ROW EXECUTE FUNCTION update_likes_count();

      -- Reposts Trigger
      CREATE OR REPLACE FUNCTION update_reposts_count() RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE public.posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.posts SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) WHERE id = OLD.post_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS reposts_count_trigger ON public.reposts;
      CREATE TRIGGER reposts_count_trigger
      AFTER INSERT OR DELETE ON public.reposts
      FOR EACH ROW EXECUTE FUNCTION update_reposts_count();

      -- Comments Trigger
      CREATE OR REPLACE FUNCTION update_comments_count() RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
      CREATE TRIGGER comments_count_trigger
      AFTER INSERT OR DELETE ON public.comments
      FOR EACH ROW EXECUTE FUNCTION update_comments_count();
      
      -- Bookmarks Trigger
      CREATE OR REPLACE FUNCTION update_bookmarks_count() RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          -- Assuming there is a bookmarks_count on posts (if not, add it)
          RETURN NEW;
        ELSIF (TG_OP = 'DELETE') THEN
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add bookmarks_count to posts if missing
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='posts' AND column_name='bookmarks_count') THEN
          ALTER TABLE public.posts ADD COLUMN bookmarks_count INTEGER DEFAULT 0;
        END IF;
      END
      $$;
    `);

    // Enable RLS and Policies for interactions
    await client.query(`
      ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

      -- Likes Policies
      DROP POLICY IF EXISTS "Public likes" ON public.likes;
      CREATE POLICY "Public likes" ON public.likes FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Auth likes" ON public.likes;
      CREATE POLICY "Auth likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth delete likes" ON public.likes;
      CREATE POLICY "Auth delete likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

      -- Reposts Policies
      DROP POLICY IF EXISTS "Public reposts" ON public.reposts;
      CREATE POLICY "Public reposts" ON public.reposts FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Auth reposts" ON public.reposts;
      CREATE POLICY "Auth reposts" ON public.reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth delete reposts" ON public.reposts;
      CREATE POLICY "Auth delete reposts" ON public.reposts FOR DELETE USING (auth.uid() = user_id);

      -- Comments Policies
      DROP POLICY IF EXISTS "Public comments" ON public.comments;
      CREATE POLICY "Public comments" ON public.comments FOR SELECT USING (true);
      DROP POLICY IF EXISTS "Auth comments" ON public.comments;
      CREATE POLICY "Auth comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth update comments" ON public.comments;
      CREATE POLICY "Auth update comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth delete comments" ON public.comments;
      CREATE POLICY "Auth delete comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

      -- Bookmarks Policies
      DROP POLICY IF EXISTS "Owner bookmarks" ON public.bookmarks;
      CREATE POLICY "Owner bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth bookmarks" ON public.bookmarks;
      CREATE POLICY "Auth bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Auth delete bookmarks" ON public.bookmarks;
      CREATE POLICY "Auth delete bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
    `);
    console.log('Created triggers and policies successfully.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
