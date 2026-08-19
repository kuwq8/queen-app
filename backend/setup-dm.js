const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    await client.query('BEGIN');

    // 1. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.conversation_participants (
        conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (conversation_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS public.messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        is_read BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Created DM tables');

    // 2. Enable RLS
    await client.query(`
      ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
    `);

    // 3. Drop existing policies to avoid errors if re-running
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
      DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
      DROP POLICY IF EXISTS "Users can insert participants" ON public.conversation_participants;
      DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
      DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
    `);

    // 4. Create RLS Policies
    // Conversations: A user can see a conversation if they are a participant
    await client.query(`
      CREATE POLICY "Users can view their conversations" ON public.conversations
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = conversations.id
          AND user_id = auth.uid()
        )
      );
      
      -- Users can create conversations
      CREATE POLICY "Users can insert conversations" ON public.conversations
      FOR INSERT WITH CHECK (true);
    `);

    // Participants: A user can see participants of their conversations
    await client.query(`
      CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants as cp
          WHERE cp.conversation_id = conversation_participants.conversation_id
          AND cp.user_id = auth.uid()
        )
      );

      -- User can insert themselves and others when starting a conversation
      CREATE POLICY "Users can insert participants" ON public.conversation_participants
      FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM public.conversation_participants as cp
          WHERE cp.conversation_id = conversation_participants.conversation_id
          AND cp.user_id = auth.uid()
        )
      );
    `);

    // Messages: A user can see and insert messages in their conversations
    await client.query(`
      CREATE POLICY "Users can view messages in their conversations" ON public.messages
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );

      CREATE POLICY "Users can insert messages in their conversations" ON public.messages
      FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
          SELECT 1 FROM public.conversation_participants
          WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
        )
      );
    `);
    console.log('Created RLS policies');

    // 5. Trigger to update conversation updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_conversation_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE public.conversations
        SET updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_new_message ON public.messages;
      CREATE TRIGGER on_new_message
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE PROCEDURE update_conversation_timestamp();
    `);

    // 6. Enable Realtime on messages
    // First, check if the table is already in the publication
    const pubRes = await client.query(`
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
    `);
    
    if (pubRes.rows.length === 0) {
      await client.query(`ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`);
      console.log('Enabled Realtime on messages table');
    } else {
      console.log('Realtime already enabled on messages table');
    }

    // Grant permissions to anon and authenticated
    await client.query(`
      GRANT SELECT, INSERT ON public.conversations TO anon, authenticated;
      GRANT SELECT, INSERT ON public.conversation_participants TO anon, authenticated;
      GRANT SELECT, INSERT ON public.messages TO anon, authenticated;
    `);

    // Ensure supabase_auth_admin has access to these new tables
    await client.query(`
      GRANT ALL ON public.conversations TO supabase_auth_admin;
      GRANT ALL ON public.conversation_participants TO supabase_auth_admin;
      GRANT ALL ON public.messages TO supabase_auth_admin;
    `);

    await client.query('COMMIT');
    console.log('Database setup complete.');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run();
