-- ==========================================
-- GEMINI SOCIAL & CHAT - ULTIMATE MASTER SCHEMA (FIXED & SAFE)
-- ==========================================
-- هذا الملف يحتوي على جميع الأكواد، مصممة بطريقة "آمنة"
-- يمكنك تشغيله 100 مرة دون أي أخطاء! وتم إصلاح خطأ Realtime فيه!

-- ==========================================
-- 1. PROFILES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. POSTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url TEXT,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public.posts;
CREATE POLICY "Posts are viewable by everyone." ON public.posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own posts." ON public.posts;
CREATE POLICY "Users can insert their own posts." ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own posts." ON public.posts;
CREATE POLICY "Users can delete own posts." ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. COMMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own comments." ON public.comments;
CREATE POLICY "Users can insert their own comments." ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments." ON public.comments;
CREATE POLICY "Users can delete own comments." ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4. FOLLOWS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows are viewable by everyone." ON public.follows;
CREATE POLICY "Follows are viewable by everyone." ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own follows." ON public.follows;
CREATE POLICY "Users can insert their own follows." ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "Users can delete their own follows." ON public.follows;
CREATE POLICY "Users can delete their own follows." ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ==========================================
-- 5. NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.social_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.social_notifications;
CREATE POLICY "Users can view their own notifications" ON public.social_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "System can insert notifications" ON public.social_notifications;
CREATE POLICY "System can insert notifications" ON public.social_notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.social_notifications;
CREATE POLICY "Users can update their own notifications" ON public.social_notifications FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 6. CHANNELS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    is_group BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    indexing_status TEXT DEFAULT 'PENDING',
    indexing_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disappearing_timer TEXT DEFAULT 'OFF'
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view public channels or channels they are members of" ON public.channels;
CREATE POLICY "Users can view public channels or channels they are members of" ON public.channels
    FOR SELECT USING (
        is_private = false OR 
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = channels.id
            AND channel_members.user_id = auth.uid()
        )
    );
DROP POLICY IF EXISTS "Authenticated users can create channels" ON public.channels;
CREATE POLICY "Authenticated users can create channels" ON public.channels FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 7. CHANNEL MEMBERS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.channel_members (
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'MEMBER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (channel_id, user_id)
);
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view members of a channel" ON public.channel_members;
CREATE POLICY "Anyone can view members of a channel" ON public.channel_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can add members to channels" ON public.channel_members;
CREATE POLICY "Users can add members to channels" ON public.channel_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Users can leave channels" ON public.channel_members;
CREATE POLICY "Users can leave channels" ON public.channel_members FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 8. MESSAGES (CLEAN & PERFECT)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_view_once BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    media_type TEXT
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their channels" ON public.messages;
CREATE POLICY "Users can view messages in their channels" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.channels 
            WHERE channels.id = messages.channel_id AND channels.is_private = false
        ) OR 
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = messages.channel_id
            AND channel_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert messages in their channels" ON public.messages;
CREATE POLICY "Users can insert messages in their channels" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.channel_members
            WHERE channel_members.channel_id = messages.channel_id
            AND channel_members.user_id = auth.uid()
        )
    );

-- سياسة التحديث ضرورية جداً لميزة "حذف لدى الجميع"
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);


-- ==========================================
-- 9. MESSAGE DELETIONS, VIEWERS, REACTIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.message_deletions (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    deleted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);
ALTER TABLE public.message_deletions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own deletions" ON public.message_deletions;
CREATE POLICY "Users can manage their own deletions" ON public.message_deletions 
    FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.message_viewers (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (message_id, user_id)
);
ALTER TABLE public.message_viewers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own view records" ON public.message_viewers;
CREATE POLICY "Users can view their own view records" ON public.message_viewers 
    FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (message_id, user_id, reaction)
);
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone in the channel can see reactions" ON public.message_reactions;
CREATE POLICY "Anyone in the channel can see reactions" ON public.message_reactions 
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.message_reactions;
CREATE POLICY "Users can manage their own reactions" ON public.message_reactions 
    FOR ALL USING (auth.uid() = user_id);


-- ==========================================
-- 10. RPC FUNCTIONS & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION public.increment_post_view(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.posts
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_private_chat(other_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_channel_id UUID;
  new_channel_id UUID;
BEGIN
  SELECT c.id INTO existing_channel_id
  FROM public.channels c
  JOIN public.channel_members m1 ON c.id = m1.channel_id
  JOIN public.channel_members m2 ON c.id = m2.channel_id
  WHERE c.is_group = false
    AND m1.user_id = auth.uid()
    AND m2.user_id = other_user_id
  LIMIT 1;

  IF existing_channel_id IS NOT NULL THEN
    RETURN existing_channel_id;
  END IF;

  INSERT INTO public.channels (is_group, is_private, name)
  VALUES (false, true, '')
  RETURNING id INTO new_channel_id;

  INSERT INTO public.channel_members (channel_id, user_id)
  VALUES (new_channel_id, auth.uid()), (new_channel_id, other_user_id);

  RETURN new_channel_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_comment() 
RETURNS TRIGGER AS $$
DECLARE
  post_owner UUID;
BEGIN
  SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner != NEW.user_id THEN
    INSERT INTO public.social_notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

CREATE OR REPLACE FUNCTION public.claim_view_once_media(msg_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.message_viewers (message_id, user_id)
  VALUES (msg_id, auth.uid());
  RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
  RETURN FALSE;
END;
$$;


-- ==========================================
-- 11. STORAGE POLICIES
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
CREATE POLICY "Users can update their own media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid() = owner);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('private_media', 'private_media', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload private media" ON storage.objects;
CREATE POLICY "Users can upload private media" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'private_media' AND auth.role() = 'authenticated');


-- ==========================================
-- 12. REALTIME (SAFE ADDITION)
-- ==========================================
-- استخدام الكود الآمن لتجنب خطأ 42710 إذا كانت الجداول موجودة مسبقاً في الـ Publication

DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; 
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions; 
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_deletions; 
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;

-- ==========================================
-- 13. RELOAD SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload schema';
