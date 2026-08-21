const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

// Add isPrivate to props
content = content.replace('onPostDeleted?: (id: string) => void;', 'onPostDeleted?: (id: string) => void;\n  isPrivate?: boolean;');
content = content.replace('export default function ChannelPostBubble({ post, currentUserId, onPostDeleted }: ChannelPostBubbleProps) {', 'export default function ChannelPostBubble({ post, currentUserId, onPostDeleted, isPrivate = false }: ChannelPostBubbleProps) {');

const rtBtn = `<button 
            onClick={handleToggleRepost}
            className={\`flex items-center gap-1.5 transition-colors \${hasReposted ? 'text-[#00a884]' : 'text-slate-400 hover:text-white'}\`}
          >
            <Repeat size={14} />
            <span className="text-xs">{repostsCount}</span>
          </button>`;

const newRtBtn = `{!isPrivate && (
          <button 
            onClick={handleToggleRepost}
            className={\`flex items-center gap-1.5 transition-colors \${hasReposted ? 'text-[#00a884]' : 'text-slate-400 hover:text-white'}\`}
          >
            <Repeat size={14} />
            <span className="text-xs">{repostsCount}</span>
          </button>
          )}`;

if (content.includes(rtBtn)) {
  content = content.replace(rtBtn, newRtBtn);
  fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
  console.log('Successfully updated ChannelPostBubble.');
} else {
  console.log('rtBtn string not found.');
  // Try regex
  const regex = /<button[\s\S]*?onClick=\{handleToggleRepost\}[\s\S]*?<\/button>/;
  if (regex.test(content)) {
    content = content.replace(regex, (match) => {
      return '{!isPrivate && (\n' + match + '\n)}';
    });
    fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
    console.log('Successfully updated ChannelPostBubble via regex.');
  } else {
    console.log('Regex also failed.');
  }
}
