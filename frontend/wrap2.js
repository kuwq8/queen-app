const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');
const lines = content.split(/\r?\n/);

const likeIdx = lines.findIndex(l => l.includes('onClick={handleLike}'));
let blockStart = -1;
let blockEnd = -1;
for (let i = likeIdx; i >= 0; i--) {
  if (lines[i].includes('</div>')) {
    blockEnd = i;
    break;
  }
}
for (let i = blockEnd; i >= 0; i--) {
  if (lines[i].includes('<div className="relative group">')) {
    blockStart = i;
    break;
  }
}
if (blockStart !== -1 && blockEnd !== -1) {
  lines.splice(blockStart, 0, '          {!post.community?.is_private && (');
  lines.splice(blockEnd + 2, 0, '          )}');
  fs.writeFileSync('src/components/PostItem.tsx', lines.join('\n'));
  console.log('Wrapped successfully');
}
