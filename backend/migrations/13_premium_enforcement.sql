-- 1. Create premium enforcement for long posts
CREATE OR REPLACE FUNCTION check_post_premium_and_limit()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
    user_is_premium BOOLEAN;
BEGIN
    -- Check how many posts the user created in the last 1 minute
    SELECT COUNT(*)
    INTO recent_count
    FROM posts
    WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';
    
    -- Limit to 5 posts per minute (Anti-Spam)
    IF recent_count >= 5 THEN
        RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: You are posting too fast. Please wait a moment.';
    END IF;
    
    -- Check Premium Status for long posts
    IF length(NEW.content) > 280 THEN
        SELECT is_premium INTO user_is_premium FROM profiles WHERE id = NEW.user_id;
        IF user_is_premium IS NOT TRUE THEN
            RAISE EXCEPTION 'PREMIUM_REQUIRED: Posts longer than 280 characters require a Premium subscription.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply combined trigger to posts
DROP TRIGGER IF EXISTS enforce_post_rate_limit ON posts;
DROP TRIGGER IF EXISTS enforce_post_premium_and_limit ON posts;
CREATE TRIGGER enforce_post_premium_and_limit
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION check_post_premium_and_limit();
