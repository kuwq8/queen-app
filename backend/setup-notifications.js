const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    console.log('Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
        type TEXT NOT NULL, -- like, comment, repost, follow, message, missed_call
        reference_id UUID, -- can be post_id, conversation_id, call_id depending on type
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('Enabling Row Level Security...');
    await client.query(`ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`);

    // Policies
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
      CREATE POLICY "Users can view their own notifications" ON public.notifications 
      FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
      CREATE POLICY "Users can update their own notifications" ON public.notifications 
      FOR UPDATE USING (auth.uid() = user_id);
      
      -- Also allow triggers (postgres user) to bypass RLS, which they do inherently.
    `);

    console.log('Creating Triggers for auto-notifications...');

    // Trigger for Likes
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_like() RETURNS TRIGGER AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
        IF post_owner != NEW.user_id THEN
          INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
          VALUES (post_owner, NEW.user_id, 'like', NEW.post_id);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_like ON public.likes;
      CREATE TRIGGER trigger_notify_like
      AFTER INSERT ON public.likes
      FOR EACH ROW EXECUTE FUNCTION notify_like();
    `);

    // Trigger for Comments
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_comment() RETURNS TRIGGER AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
        IF post_owner != NEW.user_id THEN
          INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
          VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_comment ON public.comments;
      CREATE TRIGGER trigger_notify_comment
      AFTER INSERT ON public.comments
      FOR EACH ROW EXECUTE FUNCTION notify_comment();
    `);

    // Trigger for Follows
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_follow() RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
        VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.follower_id);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_follow ON public.follows;
      CREATE TRIGGER trigger_notify_follow
      AFTER INSERT ON public.follows
      FOR EACH ROW EXECUTE FUNCTION notify_follow();
    `);

    // Trigger for Reposts
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_repost() RETURNS TRIGGER AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
        IF post_owner != NEW.user_id THEN
          INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
          VALUES (post_owner, NEW.user_id, 'repost', NEW.post_id);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_repost ON public.reposts;
      CREATE TRIGGER trigger_notify_repost
      AFTER INSERT ON public.reposts
      FOR EACH ROW EXECUTE FUNCTION notify_repost();
    `);

    // Trigger for Messages
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_message() RETURNS TRIGGER AS $$
      DECLARE
        other_user UUID;
      BEGIN
        -- Find the other participant in the conversation
        SELECT user_id INTO other_user FROM public.conversation_participants 
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id LIMIT 1;
        
        IF other_user IS NOT NULL THEN
          -- Check if an unread message notification already exists for this conversation to avoid spam
          IF NOT EXISTS (
            SELECT 1 FROM public.notifications 
            WHERE user_id = other_user AND type = 'message' AND reference_id = NEW.conversation_id AND is_read = FALSE
          ) THEN
            INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
            VALUES (other_user, NEW.sender_id, 'message', NEW.conversation_id);
          END IF;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_notify_message ON public.messages;
      CREATE TRIGGER trigger_notify_message
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION notify_message();
    `);

    console.log('Setup notifications complete!');
  } catch (err) {
    console.error('Database setup error:', err);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
