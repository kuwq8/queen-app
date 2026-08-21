const fs = require('fs');
let content = fs.readFileSync('src/app/post/[id]/ClientPage.tsx', 'utf8');

// Fix posts fetch
content = content.replace(
  /select\('\*, author:profiles\(id, username, avatar_url\)'\)/,
  "select('*, author:profiles!posts_user_id_fkey(id, username, avatar_url)')"
);

// Fix comments fetch
content = content.replace(
  /\.select\('\*, author:profiles\(id, username, avatar_url\)'\)/g,
  ".select('*, author:profiles!fk_comments_profiles(id, username, avatar_url)')"
);

// Also let's fix any occurrences in PostItem just in case? No, PostItem doesn't fetch.

fs.writeFileSync('src/app/post/[id]/ClientPage.tsx', content);
