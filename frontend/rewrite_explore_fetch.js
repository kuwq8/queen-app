const fs = require('fs');
let content = fs.readFileSync('src/app/explore/page.tsx', 'utf8');

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

      try {
        let postsQuery = supabase
          .from('posts')
          .select('*, author:profiles!posts_user_id_fkey(username, avatar_url)')
          .is('community_id', null)
          .order('created_at', { ascending: false })
          .limit(POSTS_PER_PAGE * (pageNum + 1));
          
        if (searchQuery.trim()) {
          postsQuery = postsQuery.ilike('content', \`%\${searchQuery}%\`);
        }

        const { data: normalPosts, error: postsError } = await postsQuery;
        if (postsError) throw postsError;

        let repostsData = [];
        // Only show reposts if not searching, to simplify search logic
        if (!searchQuery.trim()) {
          const { data: rData, error: rError } = await supabase
            .from('reposts')
            .select('created_at, user_id, post:posts(*, author:profiles!posts_user_id_fkey(username, avatar_url), community:communities(id, name, avatar_url))')
            .order('created_at', { ascending: false })
            .limit(POSTS_PER_PAGE * (pageNum + 1));
          
          if (rError) throw rError;
          repostsData = rData || [];
        }

        let allPosts = [...(normalPosts || [])];

        for (const r of repostsData) {
          if (r.post) {
            allPosts.push({
              ...r.post,
              is_repost_by_profile: true,
              repost_created_at: r.created_at
            });
          }
        }

        allPosts.sort((a, b) => {
          const timeA = a.is_repost_by_profile ? new Date(a.repost_created_at).getTime() : new Date(a.created_at).getTime();
          const timeB = b.is_repost_by_profile ? new Date(b.repost_created_at).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        });

        const startIndex = pageNum * POSTS_PER_PAGE;
        data = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

      } catch (err) {
        error = err;
      }

      if (error) throw error;

      if (!session) {
        if (fetchId === fetchIdRef.current) {
          setPosts(prev => pageNum === 0 ? (data || []) : [...prev, ...(data || [])]);
          setHasMore((data || []).length === POSTS_PER_PAGE);
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

    } catch (e: any) {
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

fs.writeFileSync('src/app/explore/page.tsx', content);
