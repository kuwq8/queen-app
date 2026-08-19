const fs = require('fs');
const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function performAudit() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const report = {};
  
  // 1. RLS Policies
  const rlsRes = await client.query(`
    SELECT n.nspname as schema, c.relname as table, p.polname as policy_name,
           p.polcmd as command, pg_get_expr(p.polqual, p.polrelid) as USING_clause,
           pg_get_expr(p.polwithcheck, p.polrelid) as WITH_CHECK_clause,
           r.rolname as applied_to
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_roles r ON r.oid = ANY(p.polroles)
    WHERE n.nspname IN ('public', 'storage')
  `);
  report.rls = rlsRes.rows;
  
  // 2. Triggers
  const trgRes = await client.query(`
    SELECT event_object_table as table_name, trigger_name, event_manipulation as event,
           action_statement as function
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
  `);
  report.triggers = trgRes.rows;
  
  // 3. Security Definer Functions
  const funcRes = await client.query(`
    SELECT n.nspname as schema, p.proname as function_name, 
           pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
  `);
  report.security_definer_functions = funcRes.rows;

  fs.writeFileSync('audit-data.json', JSON.stringify(report, null, 2));
  console.log('Audit data written to audit-data.json');
  await client.end();
}
performAudit();
