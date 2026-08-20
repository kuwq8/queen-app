const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

content = content.replace(/\{currentUserId === community\?\.creator_id && \([\s\S]*?\{currentUserId === community\?\.creator_id && \(\<button/, '{currentUserId === community?.creator_id && (<button');
content = content.replace(/<\/button>\)\}\s*\)\}/, '</button>)}');

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
