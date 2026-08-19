const { Client } = require('pg');
const connectionString = 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

async function fixRLS() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log('Fixing RLS infinite recursion...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.is_participant(cid uuid)
    RETURNS boolean
    LANGUAGE sql SECURITY DEFINER AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = cid AND user_id = auth.uid()
      );
    $$;

    DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
    
    CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
    FOR SELECT USING (
      user_id = auth.uid() OR public.is_participant(conversation_id)
    );
  `);
  
  // Also fix the insert policy recursion
  await client.query(`
    DROP POLICY IF EXISTS "Users can insert participants" ON public.conversation_participants;
    CREATE POLICY "Users can insert participants" ON public.conversation_participants
    FOR INSERT WITH CHECK (
      user_id = auth.uid() OR public.is_participant(conversation_id)
    );
  `);

  await client.query(`
    DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
    CREATE POLICY "Users can insert messages in their conversations" ON public.messages
    FOR INSERT WITH CHECK (
      sender_id = auth.uid() AND public.is_participant(conversation_id)
    );
    
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
    CREATE POLICY "Users can view messages in their conversations" ON public.messages
    FOR SELECT USING (
      public.is_participant(conversation_id)
    );
  `);

  console.log('Fixed!');
  await client.end();
}

fixRLS();
