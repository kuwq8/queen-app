const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB. Running Settings & Privacy Migration...');

  try {
    await client.query('BEGIN');

    // 1. Update profiles table
    console.log('Updating profiles table...');
    await client.query(`
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_messages TEXT DEFAULT 'everyone';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_calls TEXT DEFAULT 'everyone';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_comments TEXT DEFAULT 'everyone';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_interactions TEXT DEFAULT 'everyone';
      ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_activity BOOLEAN DEFAULT false;
    `);

    // 2. Update follows table
    console.log('Updating follows table...');
    await client.query(`
      ALTER TABLE public.follows ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted';
      -- Update existing ones to accepted
      UPDATE public.follows SET status = 'accepted' WHERE status IS NULL;
    `);

    // 3. Create blocks and mutes tables
    console.log('Creating blocks and mutes tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_blocks (
        blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (blocker_id, blocked_id)
      );

      CREATE TABLE IF NOT EXISTS public.user_mutes (
        muter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        muted_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (muter_id, muted_id)
      );
    `);

    // 4. Create subscriptions table
    console.log('Creating subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
        plan_id TEXT DEFAULT 'premium',
        status TEXT DEFAULT 'active',
        current_period_end TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Create Helper Functions for Privacy Checking
    console.log('Creating helper functions...');
    await client.query(`
      -- Check if blocked
      CREATE OR REPLACE FUNCTION public.is_blocked(user1 UUID, user2 UUID) RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.user_blocks 
          WHERE (blocker_id = user1 AND blocked_id = user2) 
             OR (blocker_id = user2 AND blocked_id = user1)
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Check if follows (accepted)
      CREATE OR REPLACE FUNCTION public.is_accepted_follower(follower_uuid UUID, following_uuid UUID) RETURNS BOOLEAN AS $$
      BEGIN
        RETURN EXISTS (
          SELECT 1 FROM public.follows 
          WHERE follower_id = follower_uuid AND following_id = following_uuid AND status = 'accepted'
        );
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 6. Posts RLS (Private Account Protection)
    console.log('Enforcing RLS on posts...');
    await client.query(`
      ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Users can view posts" ON public.posts;
      CREATE POLICY "Users can view posts" ON public.posts FOR SELECT USING (
        -- Owner can always view
        auth.uid() = user_id
        OR
        -- If profile is public
        EXISTS (SELECT 1 FROM public.profiles WHERE id = posts.user_id AND is_private = false)
        OR
        -- If profile is private but user is an accepted follower
        EXISTS (SELECT 1 FROM public.follows WHERE follower_id = auth.uid() AND following_id = posts.user_id AND status = 'accepted')
      );

      DROP POLICY IF EXISTS "Users can insert posts" ON public.posts;
      CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update posts" ON public.posts;
      CREATE POLICY "Users can update posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can delete posts" ON public.posts;
      CREATE POLICY "Users can delete posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
    `);

    // 7. Backend Triggers for Absolute Privacy Constraints
    console.log('Creating Privacy Enforcement Triggers...');
    
    // 7A. Follows Trigger (Pending vs Accepted, Block check)
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_follow_privacy() RETURNS TRIGGER AS $$
      DECLARE
        target_is_private BOOLEAN;
      BEGIN
        IF public.is_blocked(NEW.follower_id, NEW.following_id) THEN
          RAISE EXCEPTION 'Cannot follow a blocked user or you are blocked.';
        END IF;
        
        SELECT is_private INTO target_is_private FROM public.profiles WHERE id = NEW.following_id;
        
        IF target_is_private = true AND NEW.status IS DISTINCT FROM 'accepted' THEN
          NEW.status := 'pending';
        ELSIF target_is_private = false THEN
          NEW.status := 'accepted';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS follow_privacy_trigger ON public.follows;
      CREATE TRIGGER follow_privacy_trigger
      BEFORE INSERT ON public.follows
      FOR EACH ROW EXECUTE FUNCTION public.enforce_follow_privacy();
    `);

    // 7B. Calls Trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_call_privacy() RETURNS TRIGGER AS $$
      DECLARE
        target_allow_calls TEXT;
      BEGIN
        IF public.is_blocked(NEW.caller_id, NEW.receiver_id) THEN
          RAISE EXCEPTION 'Cannot call blocked user.';
        END IF;

        SELECT allow_calls INTO target_allow_calls FROM public.profiles WHERE id = NEW.receiver_id;
        
        IF target_allow_calls = 'nobody' THEN
          RAISE EXCEPTION 'User does not accept calls.';
        ELSIF target_allow_calls = 'followers' AND NOT public.is_accepted_follower(NEW.caller_id, NEW.receiver_id) THEN
          RAISE EXCEPTION 'User only accepts calls from followers.';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS call_privacy_trigger ON public.calls;
      CREATE TRIGGER call_privacy_trigger
      BEFORE INSERT ON public.calls
      FOR EACH ROW EXECUTE FUNCTION public.enforce_call_privacy();
    `);

    // 7C. Comments Trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_comment_privacy() RETURNS TRIGGER AS $$
      DECLARE
        post_owner UUID;
        target_allow_comments TEXT;
      BEGIN
        SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
        
        IF public.is_blocked(NEW.user_id, post_owner) THEN
          RAISE EXCEPTION 'Blocked from commenting.';
        END IF;

        SELECT allow_comments INTO target_allow_comments FROM public.profiles WHERE id = post_owner;
        
        IF target_allow_comments = 'nobody' THEN
          RAISE EXCEPTION 'Comments disabled for this post owner.';
        ELSIF target_allow_comments = 'followers' AND post_owner != NEW.user_id AND NOT public.is_accepted_follower(NEW.user_id, post_owner) THEN
          RAISE EXCEPTION 'Only followers can comment.';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS comment_privacy_trigger ON public.comments;
      CREATE TRIGGER comment_privacy_trigger
      BEFORE INSERT ON public.comments
      FOR EACH ROW EXECUTE FUNCTION public.enforce_comment_privacy();
    `);

    // 7D. Likes Trigger (Interactions)
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_like_privacy() RETURNS TRIGGER AS $$
      DECLARE
        post_owner UUID;
        target_allow_interactions TEXT;
      BEGIN
        SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
        
        IF public.is_blocked(NEW.user_id, post_owner) THEN
          RAISE EXCEPTION 'Blocked from interacting.';
        END IF;

        SELECT allow_interactions INTO target_allow_interactions FROM public.profiles WHERE id = post_owner;
        
        IF target_allow_interactions = 'nobody' THEN
          RAISE EXCEPTION 'Interactions disabled.';
        ELSIF target_allow_interactions = 'followers' AND post_owner != NEW.user_id AND NOT public.is_accepted_follower(NEW.user_id, post_owner) THEN
          RAISE EXCEPTION 'Only followers can interact.';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS like_privacy_trigger ON public.likes;
      CREATE TRIGGER like_privacy_trigger
      BEFORE INSERT ON public.likes
      FOR EACH ROW EXECUTE FUNCTION public.enforce_like_privacy();
    `);

    // 7E. Messages Privacy (Trigger on conversation_participants)
    // When someone adds someone else to a conversation, check privacy.
    await client.query(`
      CREATE OR REPLACE FUNCTION public.enforce_message_privacy() RETURNS TRIGGER AS $$
      DECLARE
        current_user_id UUID;
        target_allow_messages TEXT;
      BEGIN
        -- We assume auth.uid() is the person starting the conversation. 
        -- If NEW.user_id != auth.uid(), we check if auth.uid() is allowed to message NEW.user_id.
        current_user_id := auth.uid();
        
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

      DROP TRIGGER IF EXISTS message_privacy_trigger ON public.conversation_participants;
      CREATE TRIGGER message_privacy_trigger
      BEFORE INSERT ON public.conversation_participants
      FOR EACH ROW EXECUTE FUNCTION public.enforce_message_privacy();
    `);

    // 8. Grant privileges
    await client.query(`
      GRANT ALL ON TABLE public.user_blocks TO anon, authenticated;
      GRANT ALL ON TABLE public.user_mutes TO anon, authenticated;
      GRANT ALL ON TABLE public.subscriptions TO anon, authenticated;
      
      -- Subscription RLS (Read only for owner, NO client updates allowed)
      ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
      CREATE POLICY "Users can read own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
      
      -- User Blocks RLS
      ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read own blocks" ON public.user_blocks;
      CREATE POLICY "Users can read own blocks" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id);
      DROP POLICY IF EXISTS "Users can block" ON public.user_blocks;
      CREATE POLICY "Users can block" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
      DROP POLICY IF EXISTS "Users can unblock" ON public.user_blocks;
      CREATE POLICY "Users can unblock" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id);

      -- User Mutes RLS
      ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can read own mutes" ON public.user_mutes;
      CREATE POLICY "Users can read own mutes" ON public.user_mutes FOR SELECT USING (auth.uid() = muter_id);
      DROP POLICY IF EXISTS "Users can mute" ON public.user_mutes;
      CREATE POLICY "Users can mute" ON public.user_mutes FOR INSERT WITH CHECK (auth.uid() = muter_id);
      DROP POLICY IF EXISTS "Users can unmute" ON public.user_mutes;
      CREATE POLICY "Users can unmute" ON public.user_mutes FOR DELETE USING (auth.uid() = muter_id);
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');

  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    await client.end();
  }
}

run();
