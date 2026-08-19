const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixTriggersSecurityDefiner() {
  await client.connect();
  
  try {
    // REPOSTS
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_reposts_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET reposts_count = COALESCE(reposts_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_reposts_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET reposts_count = GREATEST(COALESCE(reposts_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // LIKES
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_likes_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_likes_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // BOOKMARKS
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_bookmarks_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET bookmarks_count = COALESCE(bookmarks_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_bookmarks_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET bookmarks_count = GREATEST(COALESCE(bookmarks_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // COMMENTS
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_comments_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id; RETURN NEW; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_comments_count() RETURNS trigger AS $$
      BEGIN UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id; RETURN OLD; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    // VIEWS
    await client.query(`DROP FUNCTION IF EXISTS increment_post_view(uuid);`);
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_post_view(post_id uuid) RETURNS void AS $$
      BEGIN UPDATE posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = post_id; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    await client.query(`DROP FUNCTION IF EXISTS increment_post_views(uuid);`);
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_post_views(post_id_val uuid) RETURNS void AS $$
      BEGIN UPDATE posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = post_id_val; END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log("Fixed all triggers to SECURITY DEFINER");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

fixTriggersSecurityDefiner();
