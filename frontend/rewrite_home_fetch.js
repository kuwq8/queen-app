const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');

const newFetchPosts = `  const fetchPosts = async (pageNum = 0) => {
    const fetchId = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      let data = [];
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

        // Add a unique key based on post.id + repost status to avoid React key collisions
        // but PostItem expects 'id'. We will modify PostItem later or just map it.
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
      }

      // Add interactions data for logged in user
      const postIds = data.map(p => p.id).filter(Boolean);
      
      if (postIds.length > 0) {
        const [likesRes, repostsRes, bookmarksRes] = await Promise.all([
          supabase.from('likes').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('reposts').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('bookmarks').select('post_id').eq('user_id', session.user.id).in('post_id', postIds)
        ]);

        const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const repostedIds = new Set(repostsRes.data?.map(r => r.post_id) || []);
        const bookmarkedIds = new Set(bookmarksRes.data?.map(b => b.post_id) || []);

        const postsWithInteractions = data.map(p => ({
          ...p,
          isLiked: likedIds.has(p.id),
          isReposted: repostedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id)
        }));

        if (fetchId === fetchIdRef.current) {
          setPosts(prev => pageNum === 0 ? postsWithInteractions : [...prev, ...postsWithInteractions]);
          setHasMore(data.length === POSTS_PER_PAGE);
        }
      } else {
        if (fetchId === fetchIdRef.current) {
          setPosts(prev => pageNum === 0 ? [] : prev);
          setHasMore(false);
        }
      }

    } catch (e) {
      console.error(e);
      if (fetchId === fetchIdRef.current) {
        setError(e.message || 'حدث خطأ أثناء تحميل المنشورات');
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };`;

const startIndex = content.indexOf('  const fetchPosts = async (pageNum = 0) => {');
const endIndex = content.indexOf('  const searchGifs = async (query: string) => {');

content = content.substring(0, startIndex) + newFetchPosts + '\n\n' + content.substring(endIndex);

fs.writeFileSync('src/app/home/page.tsx', content);
