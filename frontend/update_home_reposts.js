const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');

const oldFetchLogic = `      let query = supabase
        .from('posts')
        .select(\`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url)
        \`)
        .is('community_id', null)
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (feedType === 'following') {
        if (!session) {
          if (fetchId === fetchIdRef.current) {
            setPosts([]);
            setIsLoading(false);
          }
          return;
        }
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', session.user.id);
          
        const followingIds = followsData?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          if (fetchId === fetchIdRef.current) {
            setPosts([]);
            setIsLoading(false);
          }
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!session) {
        if (fetchId === fetchIdRef.current) {
          setPosts(prev => pageNum === 0 ? (data || []) : [...prev, ...(data || [])]);
          setHasMore((data || []).length === POSTS_PER_PAGE);
          setIsLoading(false);
        }
        return;
      }`;

const newFetchLogic = `      let data = [];
      let error = null;
      let followingIds = [];

      try {
        if (feedType === 'following') {
          if (!session) {
            if (fetchId === fetchIdRef.current) { setPosts([]); setIsLoading(false); }
            return;
          }
          const { data: followsData } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id);
          followingIds = followsData?.map(f => f.following_id) || [];
          if (followingIds.length === 0) {
            if (fetchId === fetchIdRef.current) { setPosts([]); setIsLoading(false); }
            return;
          }
        }

        // Fetch normal posts
        let postsQuery = supabase
          .from('posts')
          .select('*, author:profiles!posts_user_id_fkey(username, avatar_url)')
          .is('community_id', null)
          .order('created_at', { ascending: false })
          .limit(POSTS_PER_PAGE * (pageNum + 1));

        if (feedType === 'following') {
          postsQuery = postsQuery.in('user_id', followingIds);
        }

        const { data: normalPosts, error: postsError } = await postsQuery;
        if (postsError) throw postsError;

        // Fetch reposts
        let repostsQuery = supabase
          .from('reposts')
          .select('created_at, user_id, post:posts(*, author:profiles!posts_user_id_fkey(username, avatar_url), community:communities(id, name, avatar_url))')
          .order('created_at', { ascending: false })
          .limit(POSTS_PER_PAGE * (pageNum + 1));

        if (feedType === 'following') {
          repostsQuery = repostsQuery.in('user_id', followingIds);
        }

        const { data: repostsData, error: repostsError } = await repostsQuery;
        if (repostsError) throw repostsError;

        let allPosts = [...(normalPosts || [])];

        if (repostsData) {
          for (const r of repostsData) {
            if (r.post) {
              allPosts.push({
                ...r.post,
                is_repost_by_profile: true,
                repost_created_at: r.created_at
              });
            }
          }
        }

        // Sort combined array
        allPosts.sort((a, b) => {
          const timeA = a.is_repost_by_profile ? new Date(a.repost_created_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.is_repost_by_profile ? new Date(b.repost_created_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        });

        // Deduplicate posts (if normal post and repost of same post exist, keep both but with different keys usually? 
        // PostItem uses post.id as key. If same post is reposted and posted, we need unique IDs for rendering.
        // But for now let's just slice the page.)
        const startIndex = pageNum * POSTS_PER_PAGE;
        data = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
        
      } catch (err) {
        error = err;
      }

      if (error) throw error;

      if (!session) {
        if (fetchId === fetchIdRef.current) {
          setPosts(prev => pageNum === 0 ? data : [...prev, ...data]);
          setHasMore(data.length === POSTS_PER_PAGE);
          setIsLoading(false);
        }
        return;
      }`;

content = content.replace(oldFetchLogic, newFetchLogic);
fs.writeFileSync('src/app/home/page.tsx', content);
