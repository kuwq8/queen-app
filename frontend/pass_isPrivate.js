const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

content = content.replace(/<ChannelPostBubble\s+key=\{post\.id\}\s+post=\{post\}\s+currentUserId=\{currentUserId\}\s+onPostDeleted=\{handlePostDeleted\}\s*\/>/g, '<ChannelPostBubble key={post.id} post={post} currentUserId={currentUserId} onPostDeleted={handlePostDeleted} isPrivate={isPrivate} />');

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
