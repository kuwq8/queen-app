const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');
const lines = content.split(/\r?\n/);

// Remove `{!post.community?.is_private && (` at line 526 (or wherever it is)
const startIdx = lines.findIndex(l => l.includes('{!post.community?.is_private && ('));
if (startIdx !== -1) {
  lines.splice(startIdx, 1);
  console.log('Removed start tag');
}

// Remove `)}` at line 612 (or wherever it is after startIdx)
const endIdx = lines.findIndex((l, i) => i >= startIdx && l.trim() === ')}');
if (endIdx !== -1) {
  lines.splice(endIdx, 1);
  console.log('Removed end tag at', endIdx);
}

// Now, correctly wrap the repost block. We know it starts at `<div className="relative group">` (which is now at startIdx)
// and ends at `</div>` which is right before `<button onClick={handleLike}`.
const likeIdx = lines.findIndex(l => l.includes('onClick={handleLike}'));
let blockStart = -1;
let blockEnd = -1;
if (likeIdx !== -1) {
  for (let i = likeIdx; i >= 0; i--) {
    if (lines[i].includes('</div>')) {
      blockEnd = i;
      break;
    }
  }
  if (blockEnd !== -1) {
    for (let i = blockEnd; i >= 0; i--) {
      if (lines[i].includes('<div className="relative group">') && lines[i+1]?.includes('onClick={handleRepost}')) {
        blockStart = i;
        break;
      }
    }
  }
}

if (blockStart !== -1 && blockEnd !== -1) {
  lines.splice(blockStart, 0, '          {!post.community?.is_private && (');
  lines.splice(blockEnd + 2, 0, '          )}');
  console.log('Successfully wrapped the exact block.');
} else {
  console.log('Could not find block bounds.');
}

fs.writeFileSync('src/components/PostItem.tsx', lines.join('\n'));
