const fs = require('fs');
let content = fs.readFileSync('src/app/explore/page.tsx', 'utf8');

const oldFetchLogic = `      let query = supabase
        .from('posts')
        .select(\`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url)
        \`)
        .is('community_id', null)
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);
        
      if (searchQuery.trim()) {
        query = query.ilike('content', \`%\${searchQuery}%\`);
      }

      const { data, error } = await query;

      if (error) throw error;`;

const newFetchLogic = `      let data = [];
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

      if (error) throw error;`;

content = content.replace(oldFetchLogic, newFetchLogic);
fs.writeFileSync('src/app/explore/page.tsx', content);
