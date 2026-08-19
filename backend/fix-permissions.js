const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
      GRANT ALL ON public.profiles TO supabase_auth_admin;
      GRANT ALL ON public.posts TO supabase_auth_admin;
      GRANT ALL ON public.follows TO supabase_auth_admin;
      GRANT ALL ON public.likes TO supabase_auth_admin;
    `);
    console.log('Granted ALL privileges on public tables to supabase_auth_admin.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
