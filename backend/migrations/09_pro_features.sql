-- 09_pro_features.sql

-- 1. Add cover_url and pinned_post_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- 2. Add quoted_post_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;

-- 3. Create delete_user() RPC function (Secure)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deleting from auth.users automatically triggers ON DELETE CASCADE for public.profiles 
  -- because of the foreign key constraint established in initial migrations.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 4. Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    question TEXT,
    options JSONB NOT NULL, -- Array of strings e.g. ["Option A", "Option B"]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by everyone" ON public.polls
    FOR SELECT USING (true);

CREATE POLICY "Users can create polls for their own posts" ON public.polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts 
            WHERE id = post_id AND user_id = auth.uid()
        )
    );

-- 5. Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poll votes are viewable by everyone" ON public.poll_votes
    FOR SELECT USING (true);

CREATE POLICY "Users can vote once" ON public.poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
