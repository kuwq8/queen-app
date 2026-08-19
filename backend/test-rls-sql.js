const {Client} = require('pg');

async function testRLS() {
  const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');
  await client.connect();

  // Get two real users
  const {rows} = await client.query('SELECT id FROM auth.users LIMIT 2');
  if (rows.length < 2) {
     console.log("Not enough users to test.");
     return;
  }
  const attackerId = rows[0].id;
  const victimId = rows[1].id;

  let passed = 0, failed = 0;
  
  async function test(name, query, expectedError) {
    try {
      await client.query('BEGIN');
      // Set session to attacker
      await client.query(`SET LOCAL role = 'authenticated';`);
      await client.query(`SET LOCAL request.jwt.claims = '{"sub": "${attackerId}", "role": "authenticated"}'`);
      
      const res = await client.query(query);
      
      // For updates/deletes, if RLS blocks, rowCount is 0, no error thrown usually, so we check rowCount
      if (expectedError) {
         if (res.rowCount === 0) {
           console.log(`✅ [PASS] ${name} - Blocked by RLS as expected.`);
           passed++;
         } else {
           console.error(`❌ [FAIL] ${name} - Succeeded (Rows affected: ${res.rowCount}) but expected to fail!`);
           failed++;
         }
      } else {
         if (res.rowCount > 0) {
           console.log(`✅ [PASS] ${name}`);
           passed++;
         } else {
           console.error(`❌ [FAIL] ${name} - Failed unexpectedly (0 rows affected).`);
           failed++;
         }
      }
    } catch(e) {
      if (expectedError) {
         console.log(`✅ [PASS] ${name} - Blocked by constraint: ${e.message}`);
         passed++;
      } else {
         console.error(`❌ [FAIL] ${name} - Failed unexpectedly: ${e.message}`);
         failed++;
      }
    } finally {
      await client.query('ROLLBACK');
    }
  }

  console.log("Running RLS Attack Matrix...");
  
  // 1. Attacker modifies Victim profile
  await test('User A modifies User B profile', `UPDATE public.profiles SET bio = 'Hacked' WHERE id = '${victimId}'`, true);
  
  // 2. Attacker deletes Victim profile
  await test('User A deletes User B profile', `DELETE FROM public.profiles WHERE id = '${victimId}'`, true);
  
  // 4. Attacker creates follow as Victim
  await test('User A creates follow as User B', `INSERT INTO public.follows (follower_id, following_id) VALUES ('${victimId}', '${attackerId}')`, true);
  
  // 5. Attacker forces accepted private follow
  await test('User A forces accepted private follow', `INSERT INTO public.follows (follower_id, following_id, status) VALUES ('${attackerId}', '${victimId}', 'accepted')`, true);

  // 6. Access legacy table
  await test('Legacy table access (Post)', `UPDATE public."Post" SET content = 'Hacked'`, true);

  console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
  await client.end();
}

testRLS().catch(console.error);
