const fs = require('fs');
let content = fs.readFileSync('src/components/ChannelPostBubble.tsx', 'utf8');

const deleteBtn = `
        {currentUserId === post.user_id && (
          <button 
            onClick={async () => {
              if(!confirm('حذف؟')) return;
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.from('posts').delete().eq('id', post.id);
            }}
            className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        )}
`;

content = content.replace('{/* Time */}', deleteBtn + '\n        {/* Time */}');
fs.writeFileSync('src/components/ChannelPostBubble.tsx', content);
