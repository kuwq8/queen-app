const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function setupRateLimits() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('--- STARTING RATE LIMITING SETUP ---\\n');

  try {
    // 1. Create Indexes for fast counting
    console.log('Creating indexes for performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_rate ON public.messages(sender_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_calls_rate ON public.calls(caller_id, started_at);
      CREATE INDEX IF NOT EXISTS idx_call_signals_rate ON public.call_signals(sender_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_posts_rate ON public.posts(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_rate ON public.comments(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_likes_rate ON public.likes(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_follows_rate ON public.follows(follower_id, created_at);
    `);
    console.log('Indexes created successfully.');

    // 2. Create Trigger Functions and Triggers
    const limits = [
      { table: 'messages', col: 'sender_id', max: 30, window: '1 minute', err: 'messages', timeCol: 'created_at' },
      { table: 'calls', col: 'caller_id', max: 5, window: '1 minute', err: 'calls', timeCol: 'started_at' },
      { table: 'call_signals', col: 'sender_id', max: 15, window: '1 minute', err: 'call_signals', timeCol: 'created_at' },
      { table: 'posts', col: 'user_id', max: 10, window: '1 minute', err: 'posts', timeCol: 'created_at' },
      { table: 'comments', col: 'user_id', max: 20, window: '1 minute', err: 'comments', timeCol: 'created_at' },
      { table: 'likes', col: 'user_id', max: 50, window: '1 minute', err: 'likes', timeCol: 'created_at' },
      { table: 'follows', col: 'follower_id', max: 20, window: '1 hour', err: 'follows', timeCol: 'created_at' }
    ];

    for (const l of limits) {
      console.log(`Setting up rate limit for ${l.table}...`);
      
      const funcName = `check_rate_limit_${l.table}`;
      const triggerName = `trg_rate_limit_${l.table}`;
      
      await client.query(`
        CREATE OR REPLACE FUNCTION public.${funcName}() RETURNS trigger AS $$
        DECLARE
          recent_count int;
          current_uid uuid := auth.uid();
        BEGIN
          -- Allow backend operations (service_role) to bypass
          IF current_uid IS NULL THEN
            RETURN NEW;
          END IF;
          
          -- Enforce auth.uid() matching the NEW row to prevent client bypass
          IF NEW.${l.col} != current_uid THEN
             RAISE EXCEPTION 'UNAUTHORIZED: ${l.col} must match auth.uid()';
          END IF;
          
          -- Count recent actions
          SELECT count(*) INTO recent_count 
          FROM public.${l.table} 
          WHERE ${l.col} = current_uid 
          AND ${l.timeCol} > now() - interval '${l.window}';
          
          IF recent_count >= ${l.max} THEN
            RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: ${l.err}';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);

      await client.query(`DROP TRIGGER IF EXISTS ${triggerName} ON public.${l.table}`);
      
      await client.query(`
        CREATE TRIGGER ${triggerName}
        BEFORE INSERT ON public.${l.table}
        FOR EACH ROW EXECUTE FUNCTION public.${funcName}();
      `);
    }

    // 3. Storage Rate Limits (handled via RLS policy updates)
    console.log('Setting up Storage Rate Limit Policy (10 uploads / hour)...');
    
    // We cannot easily do a count in RLS without recursion or extreme slowdowns if the bucket has thousands of files.
    // However, since we are doing 10 per hour per user, an index on storage.objects (owner, created_at) is highly recommended.
    // Index creation on storage.objects requires higher privileges, skipping.
    const buckets = ['avatars', 'covers', 'media', 'private_media'];
    for (const b of buckets) {
      await client.query(`DROP POLICY IF EXISTS "Owner insert ${b}" ON storage.objects;`);
      
      // Update policy to include rate limiting check. 
      // If the count is >= 10, the INSERT check fails.
      await client.query(`
        CREATE POLICY "Owner insert ${b}" ON storage.objects FOR INSERT WITH CHECK (
          bucket_id = '${b}' 
          AND owner = auth.uid() 
          AND split_part(name, '/', 1) = auth.uid()::text
          AND (
            SELECT count(*) FROM storage.objects 
            WHERE owner = auth.uid() 
            AND created_at > now() - interval '1 hour'
          ) < 10
        );
      `);
    }
    
    console.log('Setup successfully completed!');
  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    await client.end();
  }
}

setupRateLimits();
