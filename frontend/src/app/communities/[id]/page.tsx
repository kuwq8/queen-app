'use client';

import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Users, Feather, Search, Share, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  
  // Mock data for the requested community
  const communityId = params.id;
  const mockCommunity = {
    id: communityId,
    name: communityId === '1' ? 'عشاق القهوة' : communityId === '2' ? 'مبرمجي كويت' : 'مجتمع مخصص',
    desc: 'مجتمع يجمع المحبين لتبادل الخبرات والنقاشات الهادفة يومياً.',
    members: '12K',
    cover: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=80',
    img: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=100&q=80'
  };

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      
      {/* Cover Image and Header */}
      <div className="relative w-full h-48 bg-slate-900 border-b border-slate-800">
        <img src={mockCommunity.cover} className="w-full h-full object-cover opacity-60" />
        
        {/* Top Navbar overlapping cover */}
        <header className="absolute top-0 left-0 right-0 p-3 px-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <Search size={18} />
            </button>
            <button className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>
      </div>

      {/* Community Info */}
      <div className="px-4 relative pb-4 border-b border-slate-800">
        <div className="flex justify-between items-end">
          <div className="w-20 h-20 rounded-full border-4 border-black bg-slate-900 overflow-hidden relative -mt-10 shadow-lg">
            <img src={mockCommunity.img} className="w-full h-full object-cover" />
          </div>
          <button className="bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-slate-200 transition-colors shadow-lg">
            انضمام
          </button>
        </div>
        
        <div className="mt-3">
          <h1 className="text-2xl font-bold text-white leading-tight">{mockCommunity.name}</h1>
          <p className="text-slate-400 text-[14px] mt-1.5 leading-snug">{mockCommunity.desc}</p>
          
          <div className="flex items-center gap-4 mt-3 text-[14px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users size={16} />
              <span className="font-bold text-white">{mockCommunity.members}</span> <span>عضو</span>
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
        <button className="px-6 py-3 text-sm font-bold text-white border-b-2 border-cyan-500 whitespace-nowrap">المنشورات</button>
        <button className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-300 whitespace-nowrap transition-colors">الأعضاء</button>
        <button className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-300 whitespace-nowrap transition-colors">القواعد</button>
      </div>

      {/* Main Feed Content (Mock) */}
      <main className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
          <Feather className="text-slate-500" size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">لا توجد منشورات بعد</h3>
        <p className="text-slate-400 text-sm max-w-[250px]">كن أول من يشارك فكرة أو ينشر صورة في هذا المجتمع!</p>
      </main>

      {/* Floating Action Button (FAB) for posting in this community */}
      <button 
        onClick={() => router.push(`/communities/${communityId}/post`)}
        className="fixed bottom-6 left-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-cyan-500/30 z-40 transition-transform hover:scale-105"
      >
        <Feather size={24} />
      </button>

    </div>
  );
}
