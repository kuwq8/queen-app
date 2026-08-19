// No external non-pg requires needed

async function runTests() {
  console.log('--- Running Direct API Privacy Tests ---');
  
  // 1. We will use SQL directly to test RLS since we have PG connection from earlier
  const { Client } = require('pg');
  const client = new Client({
    connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
  });
  
  await client.connect();
  
  try {
    // A. Create two test users
    console.log('Creating test users...');
    const u1 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test1_${Date.now()}@test.com') RETURNING id`);
    const u2 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test2_${Date.now()}@test.com') RETURNING id`);
    const user1Id = u1.rows[0].id;
    const user2Id = u2.rows[0].id;
    
    // Profiles should be created by trigger, let's wait a second
    await new Promise(r => setTimeout(r, 1000));
    
    // Set user2 to 'nobody' for calls
    await client.query(`UPDATE public.profiles SET allow_calls = 'nobody' WHERE id = $1`, [user2Id]);
    
    // B. Test Call Block
    console.log('Testing Call Privacy (allow_calls=nobody)...');
    try {
      // Simulate RLS by setting role to authenticated and uid to user1Id
      await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user1Id}';`);
      
      await client.query(`INSERT INTO public.calls (caller_id, receiver_id) VALUES ($1, $2)`, [user1Id, user2Id]);
      console.error('❌ FAIL: Call was allowed despite privacy settings!');
    } catch (err) {
      if (err.message.includes('User does not accept calls')) {
        console.log('✅ PASS: Call was correctly blocked by trigger.');
      } else {
        console.error('❌ FAIL: Unexpected error:', err.message);
      }
    }
    
    // RESET role
    await client.query(`RESET role;`);
    
    // C. Test Block User
    console.log('Testing User Block...');
    await client.query(`INSERT INTO public.user_blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [user2Id, user1Id]);
    
    try {
      await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user1Id}';`);
      // User 1 tries to follow User 2
      await client.query(`INSERT INTO public.follows (follower_id, following_id) VALUES ($1, $2)`, [user1Id, user2Id]);
      console.error('❌ FAIL: Follow was allowed despite block!');
    } catch (err) {
      if (err.message.includes('blocked')) {
        console.log('✅ PASS: Follow was correctly blocked.');
      } else {
        console.error('❌ FAIL: Unexpected error:', err.message);
      }
    }
    await client.query(`RESET role;`);

    // D. Test Private Posts RLS
    console.log('Testing Private Posts RLS...');
    await client.query(`UPDATE public.profiles SET is_private = true WHERE id = $1`, [user2Id]);
    // User 2 creates a post
    await client.query(`INSERT INTO public.posts (user_id, content) VALUES ($1, 'Secret Post')`, [user2Id]);
    
    // User 1 tries to view
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user1Id}';`);
    const posts = await client.query(`SELECT * FROM public.posts WHERE user_id = $1`, [user2Id]);
    if (posts.rows.length === 0) {
      console.log('✅ PASS: Private posts are hidden via RLS.');
    } else {
      console.error('❌ FAIL: Private posts are visible!');
    }
    
    await client.query(`RESET role;`);
    
    // Cleanup
    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2)`, [user1Id, user2Id]);

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await client.end();
  }
}

runTests();
