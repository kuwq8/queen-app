const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function auditDB() {
  const client = new Client({ connectionString });
  await client.connect();

  const report = {};

  try {
    console.log('Auditing Database Schema...');

    // 1. Tables and RLS status
    const tablesRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public';
    `);
    report.tables = tablesRes.rows;

    // 2. Policies
    const policiesRes = await client.query(`
      SELECT tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public';
    `);
    report.policies = policiesRes.rows;

    // 3. Triggers
    const triggersRes = await client.query(`
      SELECT event_object_table as table_name, trigger_name, event_manipulation as event, action_statement
      FROM information_schema.triggers
      WHERE trigger_schema = 'public';
    `);
    report.triggers = triggersRes.rows;

    // 4. Missing Indexes (simple heuristic: foreign keys without indexes)
    const fkRes = await client.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `);
    
    const indexesRes = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public';
    `);
    
    report.foreignKeys = fkRes.rows;
    report.indexes = indexesRes.rows;

    // 5. Functions
    const funcsRes = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    `);
    report.functions = funcsRes.rows;

    fs.writeFileSync(path.join(__dirname, 'db_audit.json'), JSON.stringify(report, null, 2));
    console.log('DB Audit saved to db_audit.json');

  } catch(e) {
    console.error('Error in DB Audit:', e);
  } finally {
    await client.end();
  }
}

auditDB();
