const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const lines = content.split(/\r?\n/);
let buttonStartIdx = -1;
let buttonEndIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={handleRepost}')) {
    // Find the preceding `<button` (actually there's a `<div className="relative group">` wrapping it, we should probably wrap that or just the button. The button is fine.)
    // Actually, in PostItem, the button is inside a `<div className="relative group">`.
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('<div className="relative group">')) {
        buttonStartIdx = j;
        break;
      }
    }
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('</div>')) {
        // Find the matching closing div for that button. Let's just wrap the whole block manually with regex or simpler string replacement.
        break;
      }
    }
    break;
  }
}
// Using string replace is safer for PostItem retweet button.
const retweetBlockStr = `<div className="relative group">
            <button 
              onClick={handleRepost}
              className={\`flex items-center gap-1.5 transition-colors group \${hasReposted ? 'text-[#00a884]' : 'hover:text-[#00a884] text-slate-500'}\`}
            >
              <div className={\`p-2 rounded-full transition-colors \${hasReposted ? '' : 'group-hover:bg-[#00a884]/10'}\`}>
                <Repeat size={18} />
              </div>
              <span className="text-sm">{repostsCount}</span>
            </button>
          </div>`;

const newRetweetBlockStr = `{!post.community?.is_private && (
          <div className="relative group">
            <button 
              onClick={handleRepost}
              className={\`flex items-center gap-1.5 transition-colors group \${hasReposted ? 'text-[#00a884]' : 'hover:text-[#00a884] text-slate-500'}\`}
            >
              <div className={\`p-2 rounded-full transition-colors \${hasReposted ? '' : 'group-hover:bg-[#00a884]/10'}\`}>
                <Repeat size={18} />
              </div>
              <span className="text-sm">{repostsCount}</span>
            </button>
          </div>
          )}`;

if (content.includes(retweetBlockStr)) {
  content = content.replace(retweetBlockStr, newRetweetBlockStr);
  fs.writeFileSync('src/components/PostItem.tsx', content);
  console.log("Successfully updated PostItem retweet button.");
} else {
  console.log("Could not find the retweet block string in PostItem.");
}
