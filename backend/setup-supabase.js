const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected');

  try {
    // 1. Create profiles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created profiles table');

    // 2. Create trigger for auth.users to auto-create profile and User
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, username, avatar_url)
        VALUES (
          new.id, 
          COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)), 
          new.raw_user_meta_data->>'avatar_url'
        ) ON CONFLICT (id) DO NOTHING;
        
        INSERT INTO public."User" (id, email, username, password, "updatedAt")
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
          '',
          NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);
    console.log('Created trigger for new users');

    // 3. Create posts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        media_url TEXT,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        is_comments_disabled BOOLEAN DEFAULT false,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        reposts_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created posts table');

    // 4. Create bookmarks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.bookmarks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );
    `);
    console.log('Created bookmarks table');

    // Since Prisma might have overwritten or created conflicting tables like Post, Profile.
    // We leave Prisma tables alone for now, NestJS can still use CommunityServer.
    
    // 5. Create comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Created comments table');

    // 6. Create likes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('Created likes table');

    // 7. Create reposts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reposts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('Created reposts table');

    // Grant privileges to Supabase API roles
    await client.query(`
      GRANT ALL ON TABLE public.profiles TO anon, authenticated;
      GRANT ALL ON TABLE public.posts TO anon, authenticated;
      GRANT ALL ON TABLE public.bookmarks TO anon, authenticated;
      GRANT ALL ON TABLE public.comments TO anon, authenticated;
      GRANT ALL ON TABLE public.likes TO anon, authenticated;
      GRANT ALL ON TABLE public.reposts TO anon, authenticated;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    `);
    console.log('Granted privileges');

    // Add columns to posts if they were created without them before
    await client.query(`
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reposts_count INTEGER DEFAULT 0;
      ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
    `);

    // Create RPC for increment_post_view
    await client.query(`
      CREATE OR REPLACE FUNCTION public.increment_post_view(post_id UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE public.posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = post_id;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      CREATE OR REPLACE FUNCTION public.increment_post_views(post_id_val UUID)
      RETURNS void AS $$
      BEGIN
        UPDATE public.posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = post_id_val;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    console.log('Created RPC functions');

    // Also insert existing auth.users into profiles just in case they already logged in!
    await client.query(`
      INSERT INTO public.profiles (id, username, avatar_url)
      SELECT id, COALESCE(raw_user_meta_data->>'user_name', split_part(email, '@', 1)), raw_user_meta_data->>'avatar_url'
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
      
      INSERT INTO public."User" (id, email, username, password, "updatedAt")
      SELECT id, email, COALESCE(raw_user_meta_data->>'user_name', split_part(email, '@', 1)), '', NOW()
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Backfilled existing users');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
