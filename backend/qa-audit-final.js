const { Client } = require('pg');

const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function runQA() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const report = {
    PASS: [],
    FAIL: [],
    SECURITY: [],
    REGRESSION: []
  };

  try {
    console.log('--- STARTING QA AUDIT ---');
    
    const u1 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'qa1_${Date.now()}@test.com') RETURNING id`);
    const u2 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'qa2_${Date.now()}@test.com') RETURNING id`);
    const u3 = await client.query(`INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'qa3_${Date.now()}@test.com') RETURNING id`);
    
    const user1 = u1.rows[0].id;
    const user2 = u2.rows[0].id;
    const user3 = u3.rows[0].id;
    
    await new Promise(r => setTimeout(r, 1000));

    // ==========================================
    // 3. Private Account
    // ==========================================
    await client.query(`UPDATE public.profiles SET is_private = true WHERE id = $1`, [user1]);
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    let res = await client.query(`INSERT INTO public.follows (follower_id, following_id) VALUES ($1, $2) RETURNING status`, [user2, user1]);
    if (res.rows[0].status === 'pending') {
      report.PASS.push({ name: 'Private Account - Follow Request', expected: 'pending', actual: 'pending' });
    } else {
      report.FAIL.push({ name: 'Private Account - Follow Request', expected: 'pending', actual: res.rows[0].status, err: 'Status not pending', file: 'follows trigger' });
    }
    await client.query(`COMMIT`);
    
    await client.query(`INSERT INTO public.posts (user_id, content) VALUES ($1, 'Private Post')`, [user1]);
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    res = await client.query(`SELECT * FROM public.posts WHERE user_id = $1`, [user1]);
    if (res.rows.length === 0) {
      report.PASS.push({ name: 'Private Account - Post Visibility (Non-follower)', expected: '0 rows', actual: '0 rows' });
    } else {
      report.SECURITY.push({ name: 'Private Account - Post Visibility (Non-follower)', expected: '0 rows', actual: `${res.rows.length} rows`, err: 'RLS failed to block post', file: 'posts RLS' });
    }
    await client.query(`COMMIT`);
    
    await client.query(`UPDATE public.follows SET status = 'accepted' WHERE follower_id = $1 AND following_id = $2`, [user2, user1]);
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    res = await client.query(`SELECT * FROM public.posts WHERE user_id = $1`, [user1]);
    if (res.rows.length > 0) {
      report.PASS.push({ name: 'Private Account - Post Visibility (Accepted Follower)', expected: '>0 rows', actual: `${res.rows.length} rows` });
    } else {
      report.FAIL.push({ name: 'Private Account - Post Visibility (Accepted Follower)', expected: '>0 rows', actual: '0 rows', err: 'RLS blocked accepted follower', file: 'posts RLS' });
    }
    await client.query(`COMMIT`);

    // ==========================================
    // 4. Messages Privacy
    // ==========================================
    await client.query(`UPDATE public.profiles SET allow_messages = 'nobody' WHERE id = $1`, [user1]);
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    try {
      const conv = await client.query(`INSERT INTO public.conversations DEFAULT VALUES RETURNING id`);
      await client.query(`INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [conv.rows[0].id, user1]);
      report.SECURITY.push({ name: 'Message Privacy - allow_messages=nobody', expected: 'Error', actual: 'Success', err: 'Message trigger failed to block insert', file: 'conversation_participants trigger' });
    } catch(err) {
      if (err.message.includes('nobody') || err.message.includes('messages')) {
        report.PASS.push({ name: 'Message Privacy - allow_messages=nobody', expected: 'Blocked', actual: 'Blocked' });
      } else {
        report.FAIL.push({ name: 'Message Privacy - allow_messages=nobody', expected: 'Blocked', actual: err.message, err: 'Wrong error', file: 'conversation_participants trigger' });
      }
    }
    await client.query(`COMMIT`);

    // ==========================================
    // 5. Calls Privacy
    // ==========================================
    await client.query(`UPDATE public.profiles SET allow_calls = 'followers' WHERE id = $1`, [user1]);
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user3}';`);
    try {
      await client.query(`INSERT INTO public.calls (caller_id, receiver_id, call_type) VALUES ($1, $2, 'audio')`, [user3, user1]);
      report.SECURITY.push({ name: 'Call Privacy - allow_calls=followers (Non-follower)', expected: 'Error', actual: 'Success', err: 'Call trigger failed to block', file: 'calls trigger' });
    } catch(err) {
      if (err.message.includes('followers') || err.message.includes('calls')) {
        report.PASS.push({ name: 'Call Privacy - allow_calls=followers (Non-follower)', expected: 'Blocked', actual: 'Blocked' });
      } else {
        report.FAIL.push({ name: 'Call Privacy - allow_calls=followers (Non-follower)', expected: 'Blocked', actual: err.message, err: 'Wrong error', file: 'calls trigger' });
      }
    }
    await client.query(`COMMIT`);

    // ==========================================
    // 8. Block
    // ==========================================
    await client.query(`INSERT INTO public.user_blocks (blocker_id, blocked_id) VALUES ($1, $2)`, [user1, user2]);
    
    const postRes = await client.query(`SELECT id FROM public.posts WHERE user_id = $1 LIMIT 1`, [user1]);
    const postId = postRes.rows[0].id;
    
    await client.query(`BEGIN`);
    await client.query(`SET LOCAL role = 'authenticated'; SET LOCAL request.jwt.claim.sub = '${user2}';`);
    try {
      await client.query(`INSERT INTO public.likes (user_id, post_id) VALUES ($1, $2)`, [user2, postId]);
      report.SECURITY.push({ name: 'Block - Like', expected: 'Error', actual: 'Success', err: 'Blocked user could like', file: 'likes trigger' });
    } catch(err) {
      if (err.message.includes('Blocked')) {
        report.PASS.push({ name: 'Block - Like', expected: 'Blocked', actual: 'Blocked' });
      } else {
        report.FAIL.push({ name: 'Block - Like', expected: 'Blocked', actual: err.message, err: 'Wrong error', file: 'likes trigger' });
      }
    }
    await client.query(`COMMIT`);

    await client.query(`DELETE FROM auth.users WHERE id IN ($1, $2, $3)`, [user1, user2, user3]);
    
    console.log(JSON.stringify(report, null, 2));

  } catch(e) {
    console.error('CRITICAL QA ERROR:', e);
  } finally {
    await client.end();
  }
}

runQA();
