const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const regexBanner = /\{post\.community && \([\s\S]*?🎙️ بث من قناة \{post\.community\.name\}[\s\S]*?<\/div>[\s\S]*?\)\}/;
content = content.replace(regexBanner, '');

const regexContent = /\{post\.content && \([\s\S]*?<p className="mt-1 text-slate-200 whitespace-pre-wrap break-words text-\[15px\] leading-relaxed">[\s\S]*?\{renderContentWithHashtags\(post\.content\)\}[\s\S]*?<\/p>[\s\S]*?\)\}/;

const newContentStr = `{post.content && (
              post.community ? (
                <div 
                  className="w-full bg-[#202c33] rounded-2xl rounded-tr-none p-4 relative shadow-md group mt-2 mb-2 cursor-pointer border border-slate-700/50" 
                  onClick={(e) => { e.stopPropagation(); window.location.href = '/communities/' + post.community.id; }}
                >
                  <div className="text-[#e9edef] text-[15px] whitespace-pre-wrap break-words leading-relaxed pb-2" dir="auto">
                    {renderContentWithHashtags(post.content)}
                  </div>
                  <div className="flex justify-end items-center text-[10px] text-slate-400 gap-1 mt-1 font-bold">
                    🎙️ بث من قناة {post.community.name}
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-slate-200 whitespace-pre-wrap break-words text-[15px] leading-relaxed" dir="auto">
                  {renderContentWithHashtags(post.content)}
                </p>
              )
            )}`;

if (regexContent.test(content)) {
  content = content.replace(regexContent, newContentStr);
  console.log("Successfully replaced content.");
} else {
  console.log("Error: Could not find regexContent in PostItem.tsx");
}

fs.writeFileSync('src/components/PostItem.tsx', content);
