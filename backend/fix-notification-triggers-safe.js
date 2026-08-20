const { Client } = require('pg');
const client = new Client('postgresql://postgres.hamqmslzhlcnksdliipl:E3pcMy0bx2Ayupwq@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres');

async function fixNotificationTriggersSafe() {
  await client.connect();
  
  try {
    // 1. Comment
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_comment() RETURNS trigger AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        BEGIN
          SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
          IF post_owner != NEW.user_id THEN
            INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
            VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore notification errors so the main transaction (comment insert) succeeds
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 2. Like
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_like() RETURNS trigger AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        BEGIN
          SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
          IF post_owner != NEW.user_id THEN
            INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
            VALUES (post_owner, NEW.user_id, 'like', NEW.post_id);
          END IF;
        EXCEPTION WHEN OTHERS THEN
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 3. Repost
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_repost() RETURNS trigger AS $$
      DECLARE
        post_owner UUID;
      BEGIN
        BEGIN
          SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
          IF post_owner != NEW.user_id THEN
            INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
            VALUES (post_owner, NEW.user_id, 'repost', NEW.post_id);
          END IF;
        EXCEPTION WHEN OTHERS THEN
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 4. Follow
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_follow() RETURNS trigger AS $$
      BEGIN
        BEGIN
          INSERT INTO public.notifications(user_id, actor_id, type, reference_id)
          VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.follower_id);
        EXCEPTION WHEN OTHERS THEN
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 5. Message
    await client.query(`
      CREATE OR REPLACE FUNCTION notify_message() RETURNS trigger AS $$
      DECLARE
        other_user UUID;
      BEGIN
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
        EXCEPTION WHEN OTHERS THEN
        END;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log("Fixed all notification triggers to be SECURITY DEFINER with EXCEPTION handling.");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
}

fixNotificationTriggersSafe();
