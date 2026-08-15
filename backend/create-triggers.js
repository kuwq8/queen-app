const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // Likes trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_likes_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS update_post_likes_count ON public.likes;
      CREATE TRIGGER update_post_likes_count
      AFTER INSERT OR DELETE ON public.likes
      FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();
    `);
    console.log('Created likes trigger');

    // Reposts trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_reposts_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.posts SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) WHERE id = OLD.post_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS update_post_reposts_count ON public.reposts;
      CREATE TRIGGER update_post_reposts_count
      AFTER INSERT OR DELETE ON public.reposts
      FOR EACH ROW EXECUTE FUNCTION public.update_reposts_count();
    `);
    console.log('Created reposts trigger');

    // Comments trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.update_comments_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS update_post_comments_count ON public.comments;
      CREATE TRIGGER update_post_comments_count
      AFTER INSERT OR DELETE ON public.comments
      FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();
    `);
    console.log('Created comments trigger');

    // Backfill counts! Just in case there are already likes/comments/reposts
    await client.query(`
      UPDATE public.posts p
      SET 
        likes_count = (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id),
        reposts_count = (SELECT COUNT(*) FROM public.reposts r WHERE r.post_id = p.id),
        comments_count = (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id);
    `);
    console.log('Backfilled counts');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
