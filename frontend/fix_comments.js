const fs = require('fs');
let content = fs.readFileSync('src/app/post/[id]/ClientPage.tsx', 'utf8');
content = content.replace("author:profiles!posts_user_id_fkey(id, username, avatar_url)", "author:profiles(id, username, avatar_url)");
fs.writeFileSync('src/app/post/[id]/ClientPage.tsx', content);
