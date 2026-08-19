const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixAllTriggers() {
  await client.connect();
  
  try {
    // 1. REPOSTS
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_reposts_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_reposts_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. LIKES
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_likes_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_likes_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. BOOKMARKS
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_bookmarks_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET bookmarks_count = COALESCE(bookmarks_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_bookmarks_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET bookmarks_count = GREATEST(COALESCE(bookmarks_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql;
    `);

    // Fix missing RLS policies for reposts (just in case)
    await client.query(`
      DROP POLICY IF EXISTS "Users can insert reposts" ON reposts;
      CREATE POLICY "Users can insert reposts" ON reposts FOR INSERT WITH CHECK (auth.uid() = user_id);
      ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
    `);

    // Backfill all counts
    await client.query(`
      UPDATE posts SET 
        reposts_count = (SELECT count(*) FROM reposts WHERE post_id = posts.id),
        likes_count = (SELECT count(*) FROM likes WHERE post_id = posts.id),
        bookmarks_count = (SELECT count(*) FROM bookmarks WHERE post_id = posts.id);
    `);

    console.log("Fixed all triggers and RLS for reposts/likes/bookmarks");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

fixAllTriggers();
