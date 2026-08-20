const fs = require('fs');
let content = fs.readFileSync('src/app/communities/[id]/ClientPage.tsx', 'utf8');

const deleteLogic = `
  const handleDeleteCommunity = async () => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('communities').delete().eq('id', community.id);
      router.push('/home');
    } catch (e) {
      console.error(e);
      alert('فشل الحذف');
    }
  };
`;

// Insert the logic before handlePostSubmit
content = content.replace('const handlePostSubmit = async', deleteLogic + '\n  const handlePostSubmit = async');

// Add the button
const buttonJSX = `
              <button 
                onClick={toggleMembership}
                className={\`px-5 py-1.5 rounded-full font-bold text-[15px] border transition-colors \${
                  isMember 
                    ? 'border-slate-600 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 group' 
                    : 'bg-white text-black hover:bg-slate-200 border-transparent'
                }\`}
              >
                {isMember ? <span className="group-hover:hidden">عضو</span> : 'انضمام'}
                {isMember && <span className="hidden group-hover:inline">مغادرة</span>}
              </button>
              
              {currentUserId === community?.creator_id && (
                <button 
                  onClick={handleDeleteCommunity}
                  className="mr-2 px-5 py-1.5 rounded-full font-bold text-[15px] border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  حذف القناة
                </button>
              )}
`;

content = content.replace(
  /<button \s*onClick=\{toggleMembership\}[\s\S]*?<\/button>/,
  buttonJSX
);

fs.writeFileSync('src/app/communities/[id]/ClientPage.tsx', content);
