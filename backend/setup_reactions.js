const { Client } = require('pg');
async function run() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS post_reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      emoji TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(post_id, user_id, emoji)
    );
  `;
  await client.query(createTableQuery);

  // RLS
  await client.query("ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;");
  
  // Policies
  const p1 = "CREATE POLICY \"Enable read access for all users\" ON post_reactions FOR SELECT USING (true);";
  const p2 = "CREATE POLICY \"Enable insert for authenticated users only\" ON post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);";
  const p3 = "CREATE POLICY \"Enable delete for users based on user_id\" ON post_reactions FOR DELETE USING (auth.uid() = user_id);";
  
  try { await client.query(p1); } catch(e) {}
  try { await client.query(p2); } catch(e) {}
  try { await client.query(p3); } catch(e) {}

  // Enable Realtime
  const rt = `ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;`;
  try { await client.query(rt); } catch(e) {}

  console.log("Database updated successfully.");
  await client.end();
}
run();
