const fs = require('fs');
let content = fs.readFileSync('src/app/home/page.tsx', 'utf8');
content = content.replace(/key=\{post\.id\}/g, "key={post.id + (post.is_repost_by_profile ? '_repost_' + post.repost_created_at : '')}");
fs.writeFileSync('src/app/home/page.tsx', content);

let explore = fs.readFileSync('src/app/explore/page.tsx', 'utf8');
explore = explore.replace(/key=\{post\.id\}/g, "key={post.id + (post.is_repost_by_profile ? '_repost_' + post.repost_created_at : '')}");
fs.writeFileSync('src/app/explore/page.tsx', explore);

let profile = fs.readFileSync('src/app/[username]/ClientPage.tsx', 'utf8');
profile = profile.replace(/key=\{post\.id\}/g, "key={post.id + (post.is_repost_by_profile ? '_repost_' + post.repost_created_at : '')}");
fs.writeFileSync('src/app/[username]/ClientPage.tsx', profile);
