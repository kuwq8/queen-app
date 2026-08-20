const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

content = content.replace(
  'community_id: community.id',
  'community_id: community.id,\n          is_comments_disabled: true'
);

// We need to find where the "create post" button is rendered.
// Usually it's something like `<button ... onClick={() => setIsComposeOpen(true)}`
// Let's replace the whole FAB wrapper or condition
content = content.replace(
  /<button[^>]*onClick=\{\(\) => setIsComposeOpen\(true\)\}[^>]*>[\s\S]*?<\/button>/,
  `{currentUserId === community?.creator_id && ($&)}`
);

// The compose modal is `{isComposeOpen && (`
// Let's replace it with `{isComposeOpen && currentUserId === community?.creator_id && (`
content = content.replace(
  /\{isComposeOpen && \(/,
  `{isComposeOpen && currentUserId === community?.creator_id && (`
);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
