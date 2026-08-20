const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

// Undo the mistake
content = content.replace(
  'community_id: community.id,\n          is_comments_disabled: true',
  'community_id: community.id'
);

// Now put it in the right place inside handlePostSubmit
// It looks like:
/*
      const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          user_id: session.user.id,
          community_id: community.id
        });
*/
content = content.replace(
  /const \{ error \} = await supabase\s*\.from\('posts'\)\s*\.insert\(\{\s*content: newPost,\s*user_id: session\.user\.id,\s*community_id: community\.id\s*\}\);/,
  `const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          user_id: session.user.id,
          community_id: community.id,
          is_comments_disabled: true
        });`
);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
