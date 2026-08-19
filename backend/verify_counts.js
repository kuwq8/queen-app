const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function verifyCounts() {
  const client = await pool.connect();
  try {
    // 1. Check existing posts
    const res = await client.query(`
      SELECT p.id, p.comments_count, 
             (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as actual_count
      FROM posts p
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    let allMatch = true;
    for (const row of res.rows) {
      if (parseInt(row.comments_count) !== parseInt(row.actual_count)) {
        allMatch = false;
        console.log(`Mismatch on post ${row.id}: stored=${row.comments_count}, actual=${row.actual_count}`);
      }
    }
    if (allMatch) {
      console.log('All 10 posts checked have matching comments_count.');
    }

    // 2. Test triggers with an insert and delete
    // Find a test user and post
    const userRes = await client.query('SELECT id FROM auth.users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found for test.');
      return;
    }
    const userId = userRes.rows[0].id;
    
    const postRes = await client.query('SELECT id, comments_count FROM posts LIMIT 1');
    if (postRes.rows.length === 0) {
      console.log('No posts found for test.');
      return;
    }
    const post = postRes.rows[0];
    const initialCount = parseInt(post.comments_count);
    
    console.log(`Initial count for post ${post.id}: ${initialCount}`);
    
    // Insert a comment
    const insertRes = await client.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING id',
      [post.id, userId, 'Verification test comment']
    );
    const commentId = insertRes.rows[0].id;
    
    // Check count after insert
    const afterInsertRes = await client.query('SELECT comments_count FROM posts WHERE id = $1', [post.id]);
    const countAfterInsert = parseInt(afterInsertRes.rows[0].comments_count);
    console.log(`Count after insert: ${countAfterInsert} (Expected: ${initialCount + 1})`);
    
    // Delete the comment
    await client.query('DELETE FROM comments WHERE id = $1', [commentId]);
    
    // Check count after delete
    const afterDeleteRes = await client.query('SELECT comments_count FROM posts WHERE id = $1', [post.id]);
    const countAfterDelete = parseInt(afterDeleteRes.rows[0].comments_count);
    console.log(`Count after delete: ${countAfterDelete} (Expected: ${initialCount})`);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

verifyCounts();
