const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const brokenBanner = `      {post.community && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00a884] mb-3 px-3 py-1 bg-[#00a884]/10 w-fit rounded-lg cursor-pointer hover:bg-[#00a884]/20 transition-colors" onClick={(e) => { e.stopPropagation(); window.location.href = '/communities/' + post.community.id; }}>
          🎙️ بث من قناة {post.community.name}
        </div>
      )}`;

content = content.replace(brokenBanner, '');

// Now let's change how the text is rendered if post.community is true.
// Search for the paragraph that renders the content:
// <p className="text-[#e9edef] text-[15px] whitespace-pre-wrap leading-normal mb-3" dir="auto">
// {post.content}
// </p>

const oldText = `<p className="text-[#e9edef] text-[15px] whitespace-pre-wrap leading-normal mb-3" dir="auto">
              {post.content}
            </p>`;

const newText = `
            {post.community ? (
              <div className="w-full bg-[#202c33] rounded-2xl rounded-tr-none p-4 relative shadow-md group mb-3 mt-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push('/communities/' + post.community.id); }}>
                <div className="text-[#e9edef] text-[15px] whitespace-pre-wrap leading-relaxed pb-2" dir="auto">
                  {post.content}
                </div>
                {/* Visual indicator of channel */}
                <div className="flex justify-end items-center text-[10px] text-slate-400 gap-1 mt-1">
                  🎙️ {post.community.name}
                </div>
              </div>
            ) : (
              <p className="text-[#e9edef] text-[15px] whitespace-pre-wrap leading-normal mb-3" dir="auto">
                {post.content}
              </p>
            )}
`;

content = content.replace(oldText, newText);
fs.writeFileSync('src/components/PostItem.tsx', content);
