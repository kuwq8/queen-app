const fs = require('fs');
let content = fs.readFileSync('src/app/[username]/ClientPage.tsx', 'utf8');

const oldFetchPosts = `      const { data, error } = await supabase
        .from('posts')
        .select(\`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url)
        \`)
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }`;

const newFetchPosts = `      // Fetch user's own posts
      const { data: ownPosts } = await supabase
        .from('posts')
        .select(\`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url),
          community:communities(id, name, avatar_url)
        \`)
        .eq('user_id', targetProfile.id);

      // Fetch user's reposts
      const { data: repostsData } = await supabase
        .from('reposts')
        .select(\`
          created_at,
          post:posts(
            *,
            author:profiles!posts_user_id_fkey(username, avatar_url),
            community:communities(id, name, avatar_url)
          )
        \`)
        .eq('user_id', targetProfile.id);

      let allPosts = [...(ownPosts || [])];
      
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

      // Sort by creation time (or repost time if it's a repost)
      allPosts.sort((a, b) => {
        const timeA = a.is_repost_by_profile ? new Date(a.repost_created_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.is_repost_by_profile ? new Date(b.repost_created_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });

      setPosts(allPosts);`;

content = content.replace(oldFetchPosts, newFetchPosts);
fs.writeFileSync('src/app/[username]/ClientPage.tsx', content);
