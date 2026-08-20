-- Create covers bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('covers', 'covers', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Covers are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'covers');

CREATE POLICY "Users can upload their own covers" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own covers" ON storage.objects
    FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own covers" ON storage.objects
    FOR DELETE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
