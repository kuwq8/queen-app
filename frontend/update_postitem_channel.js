const fs = require('fs');
let content = fs.readFileSync('src/components/PostItem.tsx', 'utf8');

const bannerHtml = `
      {post.community && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#00a884] mb-3 px-3 py-1 bg-[#00a884]/10 w-fit rounded-lg cursor-pointer hover:bg-[#00a884]/20 transition-colors" onClick={(e) => { e.stopPropagation(); window.location.href = '/communities/' + post.community.id; }}>
          🎙️ بث من قناة {post.community.name}
        </div>
      )}
`;

content = content.replace(
  '{post.is_repost_by_profile && (',
  bannerHtml + '\n      {post.is_repost_by_profile && ('
);

fs.writeFileSync('src/components/PostItem.tsx', content);
