const { createClient } = require('../frontend/node_modules/@supabase/supabase-js');

const SUPABASE_URL = 'https://hamqmslzhlcnksdliipl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5qQ4GTHXOnCZnH6l2cH4-Q_qoQqxVh4'; // from .env.local

const attackerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const victimClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTests() {
  console.log("Creating test accounts...");
  const attackerEmail = `attacker_${Date.now()}@test.com`;
  const victimEmail = `victim_${Date.now()}@test.com`;
  
  const { data: attackerAuth, error: err1 } = await attackerClient.auth.signUp({
    email: attackerEmail,
    password: 'password123',
    options: { data: { username: 'attacker' } }
  });
  if (err1) console.error("Attacker signup error:", err1);

  const { data: victimAuth, error: err2 } = await victimClient.auth.signUp({
    email: victimEmail,
    password: 'password123',
    options: { data: { username: 'victim' } }
  });
  if (err2) console.error("Victim signup error:", err2);

  const attackerId = attackerAuth?.user?.id;
  const victimId = victimAuth?.user?.id;
  
  if (!attackerId || !victimId) {
    console.log("Could not create users, exiting.");
    return;
  }

  // Make victim private
  await victimClient.from('profiles').update({ is_private: true }).eq('id', victimId);

  console.log("Accounts created. Running Attack Matrix...");
  let passed = 0;
  let failed = 0;

  async function test(name, promise, expectedError) {
    try {
      const { data, error } = await promise;
      if (error) throw error;
      if (expectedError) {
        console.error(`❌ [FAIL] ${name} - Succeeded but expected to fail!`);
        failed++;
      } else {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      }
    } catch (e) {
      if (expectedError) {
         console.log(`✅ [PASS] ${name} - Blocked as expected.`);
         passed++;
      } else {
         console.error(`❌ [FAIL] ${name} - Failed unexpectedly: ${e.message}`);
         failed++;
      }
    }
  }

  // 1. Attacker modifies Victim profile
  await test('User A modifies User B profile', attackerClient.from('profiles').update({ bio: 'Hacked' }).eq('id', victimId).select().single(), true);
  
  // 2. Attacker deletes Victim profile
  await test('User A deletes User B profile', attackerClient.from('profiles').delete().eq('id', victimId).select().single(), true);
  
  // 3. Attacker changes own premium
  await test('User A changes own premium', attackerClient.from('profiles').update({ is_premium: true }).eq('id', attackerId).select().single(), true);
  
  // 4. Attacker creates follow as Victim
  await test('User A creates follow as User B', attackerClient.from('follows').insert({ follower_id: victimId, following_id: attackerId }).select().single(), true);
  
  // 5. Attacker forces accepted private follow
  // Insert with status accepted
  await test('User A forces accepted private follow', attackerClient.from('follows').insert({ follower_id: attackerId, following_id: victimId, status: 'accepted' }).select().single(), true);
  // Also try updating it if it was inserted as pending
  await attackerClient.from('follows').insert({ follower_id: attackerId, following_id: victimId, status: 'pending' });
  await test('User A updates follow to accepted', attackerClient.from('follows').update({ status: 'accepted' }).eq('follower_id', attackerId).eq('following_id', victimId).select().single(), true);

  // 6. Access legacy table
  await test('Legacy table access', attackerClient.from('Post').select('*').limit(1).single(), true);

  console.log(`\nResults: ${passed} Passed, ${failed} Failed.`);
}

runTests().catch(console.error);
