const fs = require('fs');
let content = fs.readFileSync('src/app/post/[id]/ClientPage.tsx', 'utf8');

const oldSelect = `.from('posts')
        .select('*, author:profiles(id, username, avatar_url)')`;
const newSelect = `.from('posts')
        .select('*, author:profiles!posts_user_id_fkey(id, username, avatar_url)')`;
content = content.replace(oldSelect, newSelect);

fs.writeFileSync('src/app/post/[id]/ClientPage.tsx', content);
