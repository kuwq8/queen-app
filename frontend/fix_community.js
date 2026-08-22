const fs = require('fs');

let content = fs.readFileSync('src/app/community/page.tsx', 'utf8');

const importRegex = /import \{ Search, Plus, ArrowRight \} from 'lucide-react';/;
content = content.replace(importRegex, "import { Search, Plus, ArrowRight, X, Image as ImageIcon, Loader2 } from 'lucide-react';");

const stateRegex = /const \[activeTab, setActiveTab\] = useState<'joined' | 'explore'>\('joined'\);/;
const newState = `const [activeTab, setActiveTab] = useState<'joined' | 'explore'>('joined');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelSlug, setNewChannelSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');`;
content = content.replace(stateRegex, newState);

const createFunction = `
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName || !newChannelSlug) {
      setCreateError('الرجاء إدخال اسم ورابط القناة');
      return;
    }
    try {
      setIsCreating(true);
      setCreateError('');
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data: existing } = await supabase.from('communities').select('id').eq('slug', newChannelSlug).single();
      if (existing) {
        setCreateError('هذا الرابط مستخدم بالفعل');
        setIsCreating(false);
        return;
      }

      const { data: community, error } = await supabase
        .from('communities')
        .insert({
          name: newChannelName,
          slug: newChannelSlug,
          description: newChannelDesc,
          created_by: currentUser.id,
          is_private: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      await supabase.from('community_members').insert({
        community_id: community.id,
        user_id: currentUser.id,
        role: 'admin'
      });
      
      setIsModalOpen(false);
      router.push(\`/c/\${community.slug}/admin\`);
    } catch (err: any) {
      setCreateError(err.message || 'حدث خطأ أثناء الإنشاء');
    } finally {
      setIsCreating(false);
    }
  };
`;
content = content.replace(/return \(\s*<div className="min-h-screen/, createFunction + '\n  return (\n    <div className="min-h-screen');

const modalHTML = `
      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">إنشاء قناة جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateChannel} className="p-4 flex flex-col gap-4 text-right" dir="rtl">
              {createError && (
                <div className="p-3 rounded-lg bg-red-900/20 text-red-500 border border-red-900/50 text-sm">
                  {createError}
                </div>
              )}
              
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-bold">اسم القناة</label>
                <input 
                  type="text" 
                  required
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="مثال: محبي التقنية"
                />
              </div>
              
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-bold">رابط القناة (إنجليزي فقط)</label>
                <div className="flex items-center" dir="ltr">
                  <span className="bg-zinc-800 border border-zinc-800 border-r-0 rounded-l-xl px-3 py-3 text-zinc-500 text-sm">@</span>
                  <input 
                    type="text" 
                    required
                    value={newChannelSlug}
                    onChange={e => setNewChannelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-r-xl text-white px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                    placeholder="tech-fans"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-bold">وصف القناة</label>
                <textarea 
                  value={newChannelDesc}
                  onChange={e => setNewChannelDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors resize-none h-24"
                  placeholder="أخبر الناس عن هذه القناة..."
                />
              </div>
              
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-bold">صورة الغلاف (اختياري)</label>
                <div className="w-full h-32 rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-400 transition-colors cursor-pointer">
                  <ImageIcon size={32} className="mb-2" />
                  <span className="text-sm">انقر لرفع صورة</span>
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isCreating ? <Loader2 size={20} className="animate-spin" /> : 'إنشاء القناة'}
              </button>
            </form>
          </div>
        </div>
      )}
`;
content = content.replace('    </div>\n  );\n}', modalHTML + '\n    </div>\n  );\n}');

content = content.replace("onClick={() => router.push('/community/create')}", "onClick={() => setIsModalOpen(true)}");

fs.writeFileSync('src/app/community/page.tsx', content);
