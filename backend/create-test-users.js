const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // We must provide valid JSONB for metadata or GoTrue will crash (500 error)
    await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1, crypt($2, gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}', '{"username": "testuser_e2e"}', false
      )
    `, ['testuser_e2e@example.com', 'Password123!']);

    await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', $1, crypt($2, gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider": "email", "providers": ["email"]}', '{"username": "testuser2_e2e"}', false
      )
    `, ['testuser2_e2e@example.com', 'Password123!']);

    console.log('Test users created with proper metadata.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
