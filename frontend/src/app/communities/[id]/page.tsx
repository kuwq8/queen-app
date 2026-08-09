'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Users, Feather, Search, MoreHorizontal } from 'lucide-react';
import PostItem from '../../../components/PostItem';

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'rules'>('posts');
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const communityId = params.id as string;
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    // Load community
    const local = JSON.parse(localStorage.getItem('local_communities') || '[]');
    const found = local.find((c: any) => c.id === communityId);
    if (found) {
      setCommunity(found);
    } else {
      // fallback to mock
      setCommunity({
        id: communityId,
        name: communityId === '1' ? 'عشاق القهوة' : communityId === '2' ? 'مبرمجي كويت' : 'مجتمع مخصص',
        desc: 'مجتمع يجمع المحبين لتبادل الخبرات والنقاشات الهادفة يومياً.',
        members: '12K',
        cover: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80',
        img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=100&q=80'
      });
    }

    // Load posts
    const storedPosts = JSON.parse(localStorage.getItem(`community_posts_${communityId}`) || '[]');
    setPosts(storedPosts);
  }, [communityId]);

  const handleSearchClick = () => {
    setShowSearch(!showSearch);
    setShowMoreMenu(false);
  };

  const handleMoreClick = () => {
    setShowMoreMenu(!showMoreMenu);
    setShowSearch(false);
  };

  if (!community) return <div className="min-h-screen bg-black" />;

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      
      {/* Cover Image and Header */}
      <div className="relative w-full h-48 bg-slate-900 border-b border-slate-800">
        <img src={community.cover} className="w-full h-full object-cover opacity-60" />
        
        {/* Top Navbar overlapping cover */}
        <header className="absolute top-0 left-0 right-0 p-3 px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronRight size={20} />
            </button>
            {showSearch && (
              <input 
                type="text" 
                placeholder="ابحث في المجتمع..." 
                className="bg-black/50 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-cyan-500 w-[140px] sm:w-48 animate-fade-in-up"
                autoFocus
              />
            )}
          </div>
          <div className="flex items-center gap-3 relative">
            <button onClick={handleSearchClick} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <Search size={18} />
            </button>
            <button onClick={handleMoreClick} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <MoreHorizontal size={18} />
            </button>
            
            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute top-10 left-0 bg-[#1a1a26] border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-44 flex flex-col z-50 animate-fade-in-up text-right">
                <button className="px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 text-right transition-colors">دعوة أصدقاء</button>
                <button className="px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 text-right transition-colors">إعدادات المجتمع</button>
                <button className="px-4 py-3 text-sm font-bold text-red-400 hover:bg-slate-800 text-right border-t border-slate-700 transition-colors">مغادرة المجتمع</button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Community Info */}
      <div className="px-4 relative pb-4 border-b border-slate-800">
        <div className="flex justify-between items-end">
          <div className="w-20 h-20 rounded-full border-4 border-black bg-slate-900 overflow-hidden relative -mt-10 shadow-lg">
            <img src={community.img} className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={() => setIsJoined(!isJoined)}
            className={`font-bold px-6 py-2 rounded-full transition-colors shadow-lg ${isJoined ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-black hover:bg-slate-200'}`}
          >
            {isJoined ? 'تم الانضمام' : 'انضمام'}
          </button>
        </div>
        
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-white leading-tight">{community.name}</h1>
          <p className="text-slate-400 text-[14px] mt-1.5 leading-snug">{community.desc}</p>
          
          <div className="flex items-center gap-4 mt-3 text-[14px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users size={16} />
              <span className="font-bold text-white">{community.members}</span> <span>عضو</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="font-bold text-white">450</span> <span>متصل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center overflow-x-auto border-b border-slate-800 bg-black sticky top-0 z-40 [&::-webkit-scrollbar]:hidden">
        <button 
          onClick={() => setActiveTab('posts')} 
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'posts' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          المنشورات
        </button>
        <button 
          onClick={() => setActiveTab('members')} 
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'members' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          الأعضاء
        </button>
        <button 
          onClick={() => setActiveTab('rules')} 
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'rules' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          القواعد
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-16">
        {activeTab === 'posts' && (
          <div className="flex flex-col w-full">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostItem 
                  key={post.id} 
                  post={post} 
                  currentUsername="أنت" 
                  onPostDeleted={() => {}} 
                  onPostEdited={() => {}} 
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                  <Feather className="text-slate-500" size={24} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">لا توجد منشورات بعد</h3>
                <p className="text-slate-400 text-sm max-w-[250px]">كن أول من يشارك فكرة أو ينشر صورة في هذا المجتمع!</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'members' && (
          <div className="flex flex-col gap-4 px-4 py-6 animate-fade-in-up">
            <h3 className="text-white font-bold mb-2">الأعضاء ({community.members})</h3>
            <div className="text-slate-500 text-sm text-center py-10">قائمة الأعضاء ستظهر هنا</div>
          </div>
        )}
        {activeTab === 'rules' && (
          <div className="flex flex-col gap-4 px-4 py-6 animate-fade-in-up">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-white font-bold mb-2">1. الاحترام المتبادل</h4>
              <p className="text-slate-400 text-sm">يرجى احترام جميع الأعضاء وعدم استخدام لغة مسيئة.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-white font-bold mb-2">2. لا للإعلانات المزعجة</h4>
              <p className="text-slate-400 text-sm">يمنع نشر الإعلانات التجارية بدون إذن مسبق.</p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) for posting in this community - Only for members */}
      {isJoined && activeTab === 'posts' && (
        <button 
          onClick={() => router.push(`/communities/${communityId}/post`)}
          className="fixed bottom-6 left-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-cyan-500/30 z-40 transition-transform hover:scale-105 animate-fade-in-up"
        >
          <Feather size={24} />
        </button>
      )}

    </div>
  );
}
