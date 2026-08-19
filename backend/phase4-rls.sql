-- 1. Profiles RLS Fix
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Follows RLS Fix
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone" ON public.follows
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows
FOR INSERT WITH CHECK (
  auth.uid() = follower_id
  AND auth.uid() != following_id
);

DROP POLICY IF EXISTS "Users can unfollow or remove followers" ON public.follows;
CREATE POLICY "Users can unfollow or remove followers" ON public.follows
FOR DELETE USING (
  auth.uid() = follower_id OR auth.uid() = following_id
);

-- 3. Legacy Tables Lockdown
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND relname IN (
            'CommunityBanner', 'UserIgnore', 'CommunityEmoji', 'CommunityBan', 
            'Profile', 'CommunityDomain', 'CommunityFakeUser', 'CommunityLog', 
            'Post', 'Comment', 'Like', 'Follows', 'Bookmark', 'Notification', 
            'ChatRoom', 'User', 'CommunityRoom', 'ChatMessage', 'CommunityServer', 
            'CommunitySettings', 'CommunityRole', 'CommunityMember', 'CommunityMessage', 
            'CommunityShortcut', 'CommunityBot', 'CommunityGift', 'ChatParticipant'
        )
    LOOP
        EXECUTE 'ALTER TABLE public."' || t || '" ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
