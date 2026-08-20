-- Create static test users in auth.users


-- Also we need to make sure they are onboarded in public.profiles!
-- We can set username and is_onboarded to true.
UPDATE public.profiles SET username = 'testuser_a', is_onboarded = true WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.profiles SET username = 'testuser_b', is_onboarded = true WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE public.profiles SET username = 'testuser_e2e', is_onboarded = true WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
