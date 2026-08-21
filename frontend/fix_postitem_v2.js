const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const brokenBanner = `      {post.community && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00a884] mb-3 px-3 py-1 bg-[#00a884]/10 w-fit rounded-lg cursor-pointer hover:bg-[#00a884]/20 transition-colors" onClick={(e) => { e.stopPropagation(); window.location.href = '/communities/' + post.community.id; }}>
          🎙️ بث من قناة {post.community.name}
        </div>
      )}`;

content = content.replace(brokenBanner, '');

// Now replace the content rendering
const oldContentStr = `            {post.content && (
              <p className="mt-1 text-slate-200 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                {renderContentWithHashtags(post.content)}
              </p>
            )}`;

const newContentStr = `            {post.content && (
              post.community ? (
                <div 
                  className="w-full bg-[#202c33] rounded-2xl rounded-tr-none p-4 relative shadow-md group mt-2 mb-2 cursor-pointer border border-slate-700/50" 
                  onClick={(e) => { e.stopPropagation(); router.push('/communities/' + post.community.id); }}
                >
                  <div className="text-[#e9edef] text-[15px] whitespace-pre-wrap break-words leading-relaxed pb-2" dir="auto">
                    {renderContentWithHashtags(post.content)}
                  </div>
                  <div className="flex justify-end items-center text-[10px] text-slate-400 gap-1 mt-1 font-bold">
                    🎙️ بث من قناة {post.community.name}
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-slate-200 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {renderContentWithHashtags(post.content)}
                </p>
              )
            )}`;

if (content.includes(oldContentStr)) {
  content = content.replace(oldContentStr, newContentStr);
  console.log("Successfully replaced content.");
} else {
  console.log("Error: Could not find oldContentStr in PostItem.tsx");
}

fs.writeFileSync('src/components/PostItem.tsx', content);
