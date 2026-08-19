require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('--- STARTING SECURITY DIRECT API TESTS ---\\n');

  // 1. Log in with existing test users to bypass email rate limit
  const userA = { email: 'qa1_1786828293774@test.com', password: 'password123' }; // Guessing email format from previous username
  const userB = { email: 'qa2_1786828294081@test.com', password: 'password123' };

  // Actually, let's just query profiles and then use admin/service key? No, we don't have it.
  // We'll try to login. If we can't guess email, we'll use a trick:
  // we can use anon key to test RLS by just trying to modify data as anon and see if it fails.
  // Wait! The user asked to test "User A vs User B".
  const { data: authA, error: errA } = await supabase.auth.signInWithPassword({ email: 'qa1_1786828293774@test.com', password: 'password123' });
  const { data: authB, error: errB } = await supabase.auth.signInWithPassword({ email: 'qa2_1786828294081@test.com', password: 'password123' });

  if (errA || errB) {
    console.error("Setup failed:", errA || errB);
    return;
  }
  
  const clientA = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: 'Bearer ' + authA.session.access_token } } });
  const clientB = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: 'Bearer ' + authB.session.access_token } } });

  console.log("Users created successfully.");
  
  // 2. Test Premium Spoofing (User A attempts to set themselves as premium)
  console.log("\\n[TEST] User A attempts to set is_premium = true");
  const { error: premiumErr } = await clientA.from('profiles').update({ is_premium: true }).eq('id', authA.user.id);
  if (premiumErr) {
    console.log("✅ PASS: Premium modification blocked by trigger.");
  } else {
    // wait, sometimes triggers throw, sometimes they swallow. Let's select it back
    const { data: profA } = await clientA.from('profiles').select('is_premium').eq('id', authA.user.id).single();
    if (profA.is_premium === false || profA.is_premium === null) {
      console.log("✅ PASS: Premium modification blocked (no update).");
    } else {
      console.log("❌ FAIL: Premium modification was allowed!");
    }
  }

  // 3. Test Private Profile / Posts
  console.log("\\n[TEST] User B sets profile to private, User A attempts to read posts");
  await clientB.from('profiles').update({ is_private: true }).eq('id', authB.user.id);
  const { data: postB } = await clientB.from('posts').insert({ user_id: authB.user.id, content: 'Secret post' }).select().single();
  
  const { data: readAttempt } = await clientA.from('posts').select('*').eq('id', postB.id);
  if (!readAttempt || readAttempt.length === 0) {
    console.log("✅ PASS: Private post read blocked.");
  } else {
    console.log("❌ FAIL: Private post read allowed.");
  }

  // 4. Test Modify Another User's Post
  console.log("\\n[TEST] User A attempts to modify User B's post");
  const { error: modErr } = await clientA.from('posts').update({ content: 'Hacked!' }).eq('id', postB.id);
  if (modErr) {
    console.log("✅ PASS: Modify blocked by RLS.");
  } else {
    // Check if it actually updated
    const { data: checkMod } = await clientB.from('posts').select('content').eq('id', postB.id).single();
    if (checkMod.content === 'Secret post') {
        console.log("✅ PASS: Modify blocked by RLS (0 rows updated silently).");
    } else {
        console.log("❌ FAIL: Modify was allowed!");
    }
  }

  // 5. Test Call Signals
  console.log("\\n[TEST] User A inserts call_signal for B, User B reads it, User A tries to read B's other signals");
  // A calls B
  const { data: call } = await clientA.from('calls').insert({ caller_id: authA.user.id, receiver_id: authB.user.id, call_type: 'audio', status: 'ringing' }).select().single();
  
  const { error: sigErr } = await clientA.from('call_signals').insert({ call_id: call.id, sender_id: authA.user.id, receiver_id: authB.user.id, event: 'offer', payload: { foo: 'bar' } });
  if (!sigErr) {
    console.log("✅ PASS: Authorized user can insert call signal.");
  } else {
    console.log("❌ FAIL: Authorized user cannot insert signal.");
  }

  // Create third user to spoof
  const { data: authC } = await supabase.auth.signUp({ email: 'userc_' + Date.now() + '@test.com', password: 'password123', options: { data: { username: 'userc_' + Date.now() } } });
  const clientC = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: 'Bearer ' + authC.session.access_token } } });
  
  const { data: readSig } = await clientC.from('call_signals').select('*').eq('call_id', call.id);
  if (!readSig || readSig.length === 0) {
    console.log("✅ PASS: Third user blocked from reading signals.");
  } else {
    console.log("❌ FAIL: Third user read signals!");
  }

  // 6. Test Notifications Spoofery
  console.log("\\n[TEST] User A attempts to insert a fake notification for User B");
  const { error: notifErr } = await clientA.from('social_notifications').insert({ user_id: authB.user.id, actor_id: authA.user.id, type: 'follow' });
  if (notifErr) {
    console.log("✅ PASS: Direct notification insert blocked.");
  } else {
    console.log("❌ FAIL: Direct notification insert allowed!");
  }

  // 7. Storage Checks
  console.log("\\n[TEST] User A attempts to upload to User B's folder in avatars");
  const { error: storageErr } = await clientA.storage.from('avatars').upload(authB.user.id + '/fake.jpg', 'fakecontent');
  if (storageErr) {
    console.log("✅ PASS: Unauthorized storage upload blocked.");
  } else {
    console.log("❌ FAIL: Unauthorized storage upload allowed!");
  }

  console.log("\\n--- SECURITY DIRECT API TESTS COMPLETE ---");
}

runTests().catch(console.error);
