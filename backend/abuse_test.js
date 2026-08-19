const { Pool } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

const USER_A = '0abd761d-80a6-4e02-8e57-9aedaf12ab54';
const USER_B = '447902df-ecd0-4db4-afe0-9480e8a79279';

async function runAbuseTests() {
  const pool = new Pool({ connectionString, max: 40 });
  const client = await pool.connect(); // Main sequential client

  console.log('--- STARTING DIRECT API ABUSE TESTS ---\\n');

  async function auth(userId, pgClient = client) {
    await pgClient.query(`SET role TO authenticated`);
    await pgClient.query(`SET request.jwt.claims TO '{"sub": "${userId}", "role": "authenticated"}'`);
  }
  
  async function clearAuth(pgClient = client) {
    await pgClient.query(`RESET role`);
    await pgClient.query(`RESET request.jwt.claims`);
  }

  // 1. Test Messages (Limit 30) - CONCURRENT TEST
  console.log('Test 1: Messages Concurrent Abuse (Limit 30)');
  try {
    await clearAuth();
    let conv = await client.query(`SELECT id FROM public.conversations LIMIT 1`);
    if (conv.rows.length === 0) {
      conv = await client.query(`INSERT INTO public.conversations DEFAULT VALUES RETURNING id`);
      await client.query(`INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES ($1, $2)`, [conv.rows[0].id, USER_A]);
    }
    const convId = conv.rows[0].id;
    
    await client.query(`DELETE FROM public.messages WHERE sender_id = $1`, [USER_A]);

    console.log('Sending 30 messages in concurrent batches of 10...');
    const results = [];
    for (let batch = 0; batch < 4; batch++) {
      const promises = [];
      const batchSize = batch === 3 ? 1 : 10; // 10, 10, 10, 1 = 31 total
      for (let i = 0; i < batchSize; i++) {
        promises.push((async () => {
          const pClient = await pool.connect();
          try {
            await auth(USER_A, pClient);
            await pClient.query(`INSERT INTO public.messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`, [convId, USER_A, `Msg ${batch * 10 + i}`]);
            return 'PASS';
          } catch (e) {
            return e.message;
          } finally {
            await clearAuth(pClient);
            pClient.release();
          }
        })());
      }
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
    }
    const passed = results.filter(r => r === 'PASS').length;
    const failed = results.filter(r => r.includes('RATE_LIMIT_EXCEEDED')).length;
    
    console.log(`Expected: ~30 PASS, >0 FAIL. Actual: ${passed} PASS, ${failed} FAIL`);
    if (failed > 0 && passed <= 30) {
      console.log('🟢 VERIFIED: Message Rate Limit (Concurrent) works!\\n');
    } else {
      console.log('🔴 FAIL: Message Rate Limit (Concurrent) failed!\\n');
      console.log(results);
    }
  } catch (err) {
    console.error('Error in messages test:', err.message, '\\n');
  }

  // 2. Test Calls (Limit 5)
  console.log('Test 2: Calls Abuse (Limit 5)');
  try {
    await clearAuth();
    await client.query(`DELETE FROM public.calls WHERE caller_id = $1`, [USER_A]);
    await auth(USER_A);

    console.log('Creating 6 calls sequentially...');
    let passed = 0;
    let failed = 0;
    for (let i = 0; i < 6; i++) {
      try {
        await client.query(`INSERT INTO public.calls (caller_id, receiver_id) VALUES ($1, $2)`, [USER_A, USER_B]);
        passed++;
      } catch (e) {
        if (e.message.includes('RATE_LIMIT_EXCEEDED')) failed++;
      }
    }
    console.log(`Expected: 5 PASS, 1 FAIL. Actual: ${passed} PASS, ${failed} FAIL`);
    if (passed === 5 && failed === 1) {
      console.log('🟢 VERIFIED: Calls Rate Limit works!\\n');
    } else {
      console.log('🔴 FAIL: Calls Rate Limit failed!\\n');
    }
  } catch (err) {
    console.error('Error in calls test:', err.message, '\\n');
  }

  // 3. Test Posts (Limit 10) - CONCURRENT TEST
  console.log('Test 3: Posts Concurrent Abuse (Limit 10)');
  try {
    await clearAuth();
    await client.query(`DELETE FROM public.posts WHERE user_id = $1`, [USER_A]);
    await auth(USER_A);

    console.log('Creating 11 posts concurrently...');
    const promises = [];
    for (let i = 0; i < 11; i++) {
      promises.push((async () => {
        const pClient = await pool.connect();
        try {
          await auth(USER_A, pClient);
          await pClient.query(`INSERT INTO public.posts (user_id, content) VALUES ($1, $2)`, [USER_A, `Post ${i}`]);
          return 'PASS';
        } catch (e) {
          return e.message;
        } finally {
          await clearAuth(pClient);
          pClient.release();
        }
      })());
    }
    
    const results = await Promise.all(promises);
    const passed = results.filter(r => r === 'PASS').length;
    const failed = results.filter(r => r.includes('RATE_LIMIT_EXCEEDED')).length;
    
    console.log(`Expected: 10 PASS, 1 FAIL. Actual: ${passed} PASS, ${failed} FAIL`);
    if (passed === 10 && failed === 1) {
      console.log('🟢 VERIFIED: Posts Rate Limit (Concurrent) works!\\n');
    } else {
      console.log('🔴 FAIL: Posts Rate Limit (Concurrent) failed!\\n');
      console.log(results);
    }
  } catch (err) {
    console.error('Error in posts test:', err.message, '\\n');
  }

  // 4. Client Spoofing Bypass Test
  console.log('Test 4: Client Spoofing Bypass');
  try {
    await auth(USER_A);
    console.log('Attempting to create post as User B while authenticated as User A...');
    let threw = false;
    try {
      await client.query(`INSERT INTO public.posts (user_id, content) VALUES ($1, $2)`, [USER_B, `Spoofed Post`]);
    } catch (e) {
      if (e.message.includes('UNAUTHORIZED')) threw = true;
      console.log(`Error received: ${e.message}`);
    }
    if (threw) {
       console.log('🟢 VERIFIED: Client spoofing blocked!\\n');
    } else {
       console.log('🔴 FAIL: Client spoofing allowed!\\n');
    }
  } catch (err) {
    console.error('Error in spoofing test:', err.message, '\\n');
  }

  await clearAuth();
  client.release();
  await pool.end();
}

runAbuseTests();
