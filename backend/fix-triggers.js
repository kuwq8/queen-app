const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixTriggers() {
  await client.connect();
  
  try {
    // Ensure the trigger uses COALESCE for NULL safety
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_comments_count()
      RETURNS trigger AS $$
      BEGIN
        UPDATE posts SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.post_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_comments_count()
      RETURNS trigger AS $$
      BEGIN
        UPDATE posts SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // We can also fix existing posts by counting actual comments!
    await client.query(`
      UPDATE posts
      SET comments_count = (
        SELECT count(*) FROM comments WHERE post_id = posts.id
      )
    `);

    console.log("Fixed comments_count triggers and backfilled existing counts.");
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

fixTriggers();
