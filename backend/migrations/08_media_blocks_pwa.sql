-- ==========================================
-- 1. CHAT MEDIA ATTACHMENTS
-- ==========================================
-- Add media columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'image' or 'audio'

-- Create chat_media bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_media', 'chat_media', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for chat_media bucket (Allow authenticated to insert, anyone to read)
DROP POLICY IF EXISTS "Public chat_media" ON storage.objects;
CREATE POLICY "Public chat_media" ON storage.objects FOR SELECT USING (bucket_id = 'chat_media');

DROP POLICY IF EXISTS "Auth insert chat_media" ON storage.objects;
CREATE POLICY "Auth insert chat_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat_media' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Auth update chat_media" ON storage.objects;
CREATE POLICY "Auth update chat_media" ON storage.objects FOR UPDATE USING (bucket_id = 'chat_media' AND auth.uid() = owner);

-- ==========================================
-- 2. BLOCK & REPORT SYSTEM
-- ==========================================
-- Create blocks table
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Enable RLS on blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Block RLS Policies
DROP POLICY IF EXISTS "Users can view blocks they are involved in" ON public.blocks;
CREATE POLICY "Users can view blocks they are involved in" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

DROP POLICY IF EXISTS "Users can insert blocks" ON public.blocks;
CREATE POLICY "Users can insert blocks" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete their blocks" ON public.blocks;
CREATE POLICY "Users can delete their blocks" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Report RLS Policies (Users can insert, only admins can view - for simplicity we just allow insert)
DROP POLICY IF EXISTS "Users can insert reports" ON public.reports;
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Expose to API
GRANT ALL ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO anon;
GRANT ALL ON public.blocks TO service_role;

GRANT ALL ON public.reports TO authenticated;
GRANT ALL ON public.reports TO anon;
GRANT ALL ON public.reports TO service_role;
