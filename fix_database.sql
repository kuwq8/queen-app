-- 1. إضافة أعمدة الحذف الناعم (Soft Delete) لجدول الرسائل
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. تحديث صلاحيات RLS لجدول الرسائل ليتمكن المستخدم من حذف (تحديث) رسائله
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- 3. التأكد من وجود جداول التفاعلات والمشاهدات والحذف الفردي
CREATE TABLE IF NOT EXISTS public.message_deletions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS public.message_viewers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 4. إعداد RLS للجداول الجديدة
ALTER TABLE public.message_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_viewers ENABLE ROW LEVEL SECURITY;

-- سياسات message_deletions
CREATE POLICY "Users can view deletions for their rooms" ON public.message_deletions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own deletions" ON public.message_deletions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات message_reactions
CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can insert reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- سياسات message_viewers
CREATE POLICY "Anyone can view viewers" ON public.message_viewers FOR SELECT USING (true);
CREATE POLICY "Users can insert their view" ON public.message_viewers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. إعداد Storage Bucket الخاص بالوسائط (media) وتصحيح سياساته
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- مسح السياسات القديمة إن وجدت لتجنب التكرار
DROP POLICY IF EXISTS "Public media access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- السماح للجميع برؤية الملفات في مجلد media
CREATE POLICY "Public media access" ON storage.objects FOR SELECT 
USING (bucket_id = 'media');

-- السماح للمستخدمين المسجلين فقط برفع الملفات
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- السماح للمستخدم بحذف ملفاته الخاصة فقط
CREATE POLICY "Users can delete own media" ON storage.objects FOR DELETE 
USING (bucket_id = 'media' AND auth.uid() = owner);
