-- Add missing profile fields and onboarding state
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false;

-- Auto-onboard legacy users
UPDATE public.profiles 
SET is_onboarded = true 
WHERE username IS NOT NULL AND username NOT LIKE 'debug%' AND username NOT LIKE 'user_%';

-- Create RPC to get combined profile feed (posts + reposts)
CREATE OR REPLACE FUNCTION get_profile_feed(target_user_id UUID, offset_val INT DEFAULT 0, limit_val INT DEFAULT 20)
RETURNS TABLE (
    id UUID,
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    likes_count INT,
    reposts_count INT,
    comments_count INT,
    is_comments_disabled BOOLEAN,
    quoted_post_id UUID,
    is_repost BOOLEAN,
    repost_created_at TIMESTAMPTZ,
    author_username TEXT,
    author_avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.content, p.media_url, p.created_at, p.user_id, 
        p.likes_count, p.reposts_count, p.comments_count, p.is_comments_disabled, p.quoted_post_id,
        FALSE as is_repost,
        p.created_at as repost_created_at,
        pr.username as author_username,
        pr.avatar_url as author_avatar_url
    FROM posts p
    JOIN profiles pr ON p.user_id = pr.id
    WHERE p.user_id = target_user_id

    UNION ALL

    SELECT 
        p.id, p.content, p.media_url, p.created_at, p.user_id, 
        p.likes_count, p.reposts_count, p.comments_count, p.is_comments_disabled, p.quoted_post_id,
        TRUE as is_repost,
        r.created_at as repost_created_at,
        pr.username as author_username,
        pr.avatar_url as author_avatar_url
    FROM reposts r
    JOIN posts p ON r.post_id = p.id
    JOIN profiles pr ON p.user_id = pr.id
    WHERE r.user_id = target_user_id

    ORDER BY repost_created_at DESC
    LIMIT limit_val OFFSET offset_val;
END;
$$ LANGUAGE plpgsql;
