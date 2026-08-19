-- Phase 2: Fix Duplicate Triggers and Recalculate Counts

BEGIN;

-- 1. Drop the duplicate triggers
DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
DROP TRIGGER IF EXISTS likes_count_trigger ON public.likes;
DROP TRIGGER IF EXISTS reposts_count_trigger ON public.reposts;

-- 2. Recalculate all existing post counters from actual data
UPDATE public.posts 
SET 
  comments_count = (SELECT count(*) FROM public.comments WHERE post_id = posts.id),
  likes_count = (SELECT count(*) FROM public.likes WHERE post_id = posts.id),
  reposts_count = (SELECT count(*) FROM public.reposts WHERE post_id = posts.id);

COMMIT;
