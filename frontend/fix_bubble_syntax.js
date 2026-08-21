const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

// Fix the syntax error at line 161
const lines = content.split(/\r?\n/);

// Remove the incorrect `{!isPrivate && (` and `)}` that wrapped the delete button
// We know it's around line 161 and the closing `)}` is at line 173 (because 162 was <button and we shifted everything down)

// Let's just find and remove them safely.
let deleteStart = lines.findIndex(l => l.includes('if(!confirm(\'هل أنت متأكد من حذف هذا البث؟\')) return;'));
// The button starts a few lines above.
let badIfStart = lines.findIndex(l => l.trim() === '{!isPrivate && (');
if (badIfStart !== -1) {
  lines.splice(badIfStart, 1);
  // Now find the matching closing bracket
  // The delete button ended around line 173
  let buttonEnd = -1;
  for (let i = badIfStart; i < lines.length; i++) {
    if (lines[i].includes('</button>')) {
      buttonEnd = i;
      break;
    }
  }
  if (buttonEnd !== -1) {
    // The closing tag was added after `</button>`
    let badIfEnd = -1;
    for (let i = buttonEnd; i < buttonEnd + 5; i++) {
      if (lines[i] && lines[i].trim() === ')}') {
        badIfEnd = i;
        break;
      }
    }
    if (badIfEnd !== -1) {
      lines.splice(badIfEnd, 1);
      console.log('Removed bad !isPrivate wrapper from delete button.');
    }
  }
}

// Now wrap the Repost pill properly
let repostClick = lines.findIndex(l => l.includes('onClick={handleToggleRepost}'));
if (repostClick !== -1) {
  // It's a `<div` pill starting at `repostClick - 1` probably
  let pillStart = -1;
  for (let i = repostClick; i >= 0; i--) {
    if (lines[i].includes('<!-- Repost Pill -->') || lines[i].includes('{/* Repost Pill */}')) {
      pillStart = i;
      break;
    }
  }
  let pillEnd = -1;
  for (let i = repostClick; i < lines.length; i++) {
    if (lines[i].includes('</div>')) {
      pillEnd = i;
      break;
    }
  }
  
  if (pillStart !== -1 && pillEnd !== -1) {
    lines.splice(pillStart + 1, 0, '          {!isPrivate && (');
    lines.splice(pillEnd + 2, 0, '          )}');
    console.log('Successfully wrapped the Repost pill.');
  }
}

content = lines.join('\n');
fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
