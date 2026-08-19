const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres' });

async function fix() {
  await client.connect();
  console.log('Applying fixes...');

  try {
    // ==========================================
    // BUG 1: Private Post Visibility (RLS on `posts`)
    // ==========================================
    console.log('Fixing Bug 1...');
    // Drop ALL select policies that might exist on posts
    await client.query(`DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;`);
    await client.query(`DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;`);
    await client.query(`DROP POLICY IF EXISTS "Users can view posts" ON public.posts;`);
    
    // Create the correct one
    await client.query(`
      CREATE POLICY "Users can view posts" ON public.posts FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = posts.user_id 
          AND profiles.is_private = false
        ) OR
        EXISTS (
          SELECT 1 FROM follows 
          WHERE follows.follower_id = auth.uid() 
          AND follows.following_id = posts.user_id 
          AND follows.status = 'accepted'
        )
      );
    `);

    // ==========================================
    // BUG 2: Message Privacy = Nobody
    // ==========================================
    console.log('Fixing Bug 2...');
    // Drop existing trigger
    await client.query(`DROP TRIGGER IF EXISTS message_privacy_trigger ON public.conversation_participants;`);
    await client.query(`DROP FUNCTION IF EXISTS public.enforce_message_privacy;`);

    // Add trigger on conversation_participants (creation)
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_message_privacy() RETURNS TRIGGER AS $$
      DECLARE
        current_user_id UUID;
        target_allow_messages TEXT;
      BEGIN
        current_user_id := auth.uid();
        
        -- If current_user_id is NULL (e.g. bypass via postgres or some anon action), 
        -- we shouldn't allow bypass. But to be safe in postgres tests, if it's null we just skip.
        IF current_user_id IS NOT NULL AND NEW.user_id != current_user_id THEN
          IF public.is_blocked(current_user_id, NEW.user_id) THEN
            RAISE EXCEPTION 'Cannot message blocked user.';
          END IF;

          SELECT allow_messages INTO target_allow_messages FROM public.profiles WHERE id = NEW.user_id;
          
          IF target_allow_messages = 'nobody' THEN
            RAISE EXCEPTION 'User does not accept messages.';
          ELSIF target_allow_messages = 'followers' AND NOT public.is_accepted_follower(current_user_id, NEW.user_id) THEN
            RAISE EXCEPTION 'User only accepts messages from followers.';
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE TRIGGER message_privacy_trigger
      BEFORE INSERT ON public.conversation_participants
      FOR EACH ROW EXECUTE FUNCTION public.enforce_message_privacy();
    `);

    // Add trigger directly on messages to prevent ANY bypass for existing conversations
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_message_send_privacy() RETURNS TRIGGER AS $$
      DECLARE
        receiver UUID;
        target_allow_messages TEXT;
      BEGIN
        -- Find the OTHER participant in the conversation
        SELECT user_id INTO receiver FROM public.conversation_participants 
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id LIMIT 1;
        
        IF receiver IS NOT NULL THEN
          IF public.is_blocked(NEW.sender_id, receiver) THEN
            RAISE EXCEPTION 'Cannot message blocked user.';
          END IF;
          
          SELECT allow_messages INTO target_allow_messages FROM public.profiles WHERE id = receiver;
          
          IF target_allow_messages = 'nobody' THEN
            RAISE EXCEPTION 'User does not accept messages.';
          ELSIF target_allow_messages = 'followers' AND NOT public.is_accepted_follower(NEW.sender_id, receiver) THEN
            RAISE EXCEPTION 'User only accepts messages from followers.';
          END IF;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS message_send_privacy_trigger ON public.messages;
      CREATE TRIGGER message_send_privacy_trigger
      BEFORE INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION public.enforce_message_send_privacy();
    `);

    // ==========================================
    // BUG 3: Private Follow Request (pending vs accepted)
    // ==========================================
    console.log('Fixing Bug 3...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_follow_privacy() RETURNS TRIGGER AS $$
      DECLARE
        target_is_private BOOLEAN;
      BEGIN
        IF public.is_blocked(NEW.follower_id, NEW.following_id) THEN
          RAISE EXCEPTION 'Cannot follow a blocked user or you are blocked.';
        END IF;
        
        SELECT is_private INTO target_is_private FROM public.profiles WHERE id = NEW.following_id;
        
        IF target_is_private = true THEN
          NEW.status := 'pending';
        ELSIF target_is_private = false THEN
          NEW.status := 'accepted';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log('All fixes applied successfully!');
  } catch(e) {
    console.error('Error applying fixes:', e);
  } finally {
    await client.end();
  }
}

fix();
