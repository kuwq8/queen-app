const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

// Add isPrivate
content = content.replace('onPostDeleted?: (id: string) => void;', 'onPostDeleted?: (id: string) => void;\n  isPrivate?: boolean;');
content = content.replace('export default function ChannelPostBubble({ post, currentUserId, onPostDeleted }: ChannelPostBubbleProps) {', 'export default function ChannelPostBubble({ post, currentUserId, onPostDeleted, isPrivate = false }: ChannelPostBubbleProps) {');

// We want to hide the repost button if isPrivate is true.
// Let's find exactly the button for reposts. It has <Repeat size={14} /> inside it.
const lines = content.split(/\r?\n/);
let inButton = false;
let buttonStartIdx = -1;
let buttonEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={handleToggleRepost}')) {
    // Find the `<button` preceding it
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('<button')) {
        buttonStartIdx = j;
        break;
      }
    }
    // Find the `</button>` after it
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('</button>')) {
        buttonEndIdx = j;
        break;
      }
    }
    break;
  }
}

if (buttonStartIdx !== -1 && buttonEndIdx !== -1) {
  lines.splice(buttonStartIdx, 0, '          {!isPrivate && (');
  lines.splice(buttonEndIdx + 2, 0, '          )}'); // +2 because we added a line, so index shifted
  content = lines.join('\n');
  fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
  console.log('Successfully updated ChannelPostBubble repost button.');
} else {
  console.log('Could not find the repost button bounds.');
}
