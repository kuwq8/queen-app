const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = 'testuser_e2e@example.com';
  const password = 'Password123!';
  
  console.log('Attempting login with:', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('Login Error:', error);
  } else {
    console.log('Login Success, session:', !!data.session);
  }
}

testAuth();
