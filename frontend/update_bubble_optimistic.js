const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

// Replace handleToggleRepost with optimistic version
const oldToggleRepost = `  const handleToggleRepost = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (hasReposted) {
        const existing = reposts.find(r => r.user_id === currentUserId);
        if (existing) {
          await supabase.from('reposts').delete().eq('id', existing.id);
        }
      } else {
        await supabase.from('reposts').insert({ post_id: post.id, user_id: currentUserId });
      }
    } catch (e) {
      console.error(e);
    }
  };`;

const newToggleRepost = `  const handleToggleRepost = async () => {
    // Optimistic UI update
    if (hasReposted) {
      setReposts(prev => prev.filter(r => r.user_id !== currentUserId));
    } else {
      setReposts(prev => [...prev, { id: 'temp', post_id: post.id, user_id: currentUserId }]);
    }
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (hasReposted) {
        const existing = reposts.find(r => r.user_id === currentUserId);
        if (existing && existing.id !== 'temp') {
          await supabase.from('reposts').delete().eq('id', existing.id);
        }
      } else {
        await supabase.from('reposts').insert({ post_id: post.id, user_id: currentUserId });
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      fetchReposts();
    }
  };`;

content = content.replace(oldToggleRepost, newToggleRepost);

// Also add optimistic update for handleToggleReaction
const oldToggleReaction = `  const handleToggleReaction = async (emoji: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const existing = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji);
      
      if (existing) {
        await supabase.from('post_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUserId, emoji });
      }
      setShowEmojiPicker(false);
    } catch (e) {
      console.error(e);
    }
  };`;

const newToggleReaction = `  const handleToggleReaction = async (emoji: string) => {
    setShowEmojiPicker(false);
    
    // Optimistic update
    const existing = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji);
    if (existing) {
      setReactions(prev => prev.filter(r => r.id !== existing.id));
    } else {
      setReactions(prev => [...prev, { id: 'temp-' + Date.now(), post_id: post.id, user_id: currentUserId, emoji }]);
    }
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (existing && !existing.id.startsWith('temp-')) {
        await supabase.from('post_reactions').delete().eq('id', existing.id);
      } else if (!existing) {
        await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUserId, emoji });
      }
    } catch (e) {
      console.error(e);
      fetchReactions();
    }
  };`;

content = content.replace(oldToggleReaction, newToggleReaction);

fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
