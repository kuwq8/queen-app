const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

const realtimeCode = `
    // Realtime subscription for posts in this community
    let channel: any;
    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      channel = supabase.channel(\`community_posts_\${id}\`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: \`community_id=eq.\${id}\` }, payload => {
          if (payload.eventType === 'INSERT') {
            fetchCommunityData(); // Easiest way to get full post data with author details
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            fetchCommunityData(); // Refresh to get updated comments_count/content
          }
        })
        .subscribe();
    };
    setupRealtime();

    return () => {
      if (channel) channel.unsubscribe();
    };
`;

// Inject this into the useEffect that runs on [id] (the main one)
// Wait, there's already:
/*
  useEffect(() => {
    fetchCommunityData();
  }, [id, router]);
*/

content = content.replace(
  /useEffect\(\(\) => \{\s*fetchCommunityData\(\);\s*\}\, \[id, router\]\);/,
  `useEffect(() => {
    fetchCommunityData();
${realtimeCode}
  }, [id, router]);`
);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
