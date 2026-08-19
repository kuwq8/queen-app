const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function setup() {
  await client.connect();
  
  console.log("Setting up Comments RLS and Trigger...");
  
  try {
    // Drop existing RLS if any
    await client.query(`DROP POLICY IF EXISTS "Users can insert comments" ON comments;`);
    await client.query(`DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;`);
    
    // Create correct Insert Policy
    await client.query(`
      CREATE POLICY "Authenticated users can insert comments" 
      ON comments FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
    `);
    
    // Enable RLS on comments if not already
    await client.query(`ALTER TABLE comments ENABLE ROW LEVEL SECURITY;`);

    // Ensure the trigger exists for comments_count
    await client.query(`
      CREATE OR REPLACE FUNCTION increment_comments_count()
      RETURNS trigger AS $$
      BEGIN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION decrement_comments_count()
      RETURNS trigger AS $$
      BEGIN
        UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop triggers if they exist to avoid duplication
    await client.query(`DROP TRIGGER IF EXISTS on_comment_inserted ON comments;`);
    await client.query(`DROP TRIGGER IF EXISTS on_comment_deleted ON comments;`);
    
    // Create triggers
    await client.query(`
      CREATE TRIGGER on_comment_inserted
      AFTER INSERT ON comments
      FOR EACH ROW EXECUTE FUNCTION increment_comments_count();
    `);
    
    await client.query(`
      CREATE TRIGGER on_comment_deleted
      AFTER DELETE ON comments
      FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();
    `);

    console.log("Successfully setup RLS and Triggers for comments.");
  } catch(e) {
    console.error("Error setting up DB:", e);
  } finally {
    await client.end();
  }
}

setup();
