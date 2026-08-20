-- 1. Add premium flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

-- 2. Create anti-spam rate limiting function
CREATE OR REPLACE FUNCTION check_post_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    -- Check how many posts the user created in the last 1 minute
    SELECT COUNT(*)
    INTO recent_count
    FROM posts
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    -- Limit to 5 posts per minute
    IF recent_count >= 5 THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: You are posting too fast. Please wait a moment.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply trigger to posts
DROP TRIGGER IF EXISTS enforce_post_rate_limit ON posts;
CREATE TRIGGER enforce_post_rate_limit
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION check_post_rate_limit();

-- 4. Create anti-spam rate limiting function for comments
CREATE OR REPLACE FUNCTION check_comment_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*)
    INTO recent_count
    FROM comments
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    IF recent_count >= 10 THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: You are commenting too fast. Please wait a moment.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply trigger to comments
DROP TRIGGER IF EXISTS enforce_comment_rate_limit ON comments;
CREATE TRIGGER enforce_comment_rate_limit
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION check_comment_rate_limit();
