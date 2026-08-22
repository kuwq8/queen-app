'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Coffee, Bell, MessageCircle } from 'lucide-react';
import MessagesSidebar from './MessagesSidebar';
import BottomNav from '../../components/BottomNav';

export default function ClientMessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="fixed inset-0 z-[40] flex h-screen w-full bg-black overflow-hidden font-sans text-right justify-center" dir="rtl">
      {/* General Container matching Twitter max width */}
      <div className="flex h-screen w-full max-w-7xl mx-auto overflow-hidden relative">
        
        {/* Main Desktop Navigation (Twitter Style) */}
        <div className="hidden md:flex flex-col w-[80px] xl:w-[250px] shrink-0 border-l border-zinc-800 h-full py-4 items-center xl:items-start xl:pr-6 gap-2">
          <div className="mb-6 p-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black text-xl">Q</div>
          </div>
          
          <Link href="/home" className="p-3 hover:bg-zinc-900 rounded-full transition-colors flex items-center gap-4 xl:w-full">
            <Home size={28} className="text-white" />
            <span className="hidden xl:block text-xl">الرئيسية</span>
          </Link>
          <Link href="/search" className="p-3 hover:bg-zinc-900 rounded-full transition-colors flex items-center gap-4 xl:w-full">
            <Search size={28} className="text-white" />
            <span className="hidden xl:block text-xl">استكشاف</span>
          </Link>
          <Link href="/community" className="p-3 hover:bg-zinc-900 rounded-full transition-colors flex items-center gap-4 xl:w-full">
            <Coffee size={28} className="text-white" />
            <span className="hidden xl:block text-xl">المجتمعات</span>
          </Link>
          <Link href="/notifications" className="p-3 hover:bg-zinc-900 rounded-full transition-colors flex items-center gap-4 xl:w-full">
            <Bell size={28} className="text-white" />
            <span className="hidden xl:block text-xl">الإشعارات</span>
          </Link>
          <Link href="/messages" className="p-3 bg-zinc-900 rounded-full transition-colors flex items-center gap-4 xl:w-full">
            <MessageCircle size={28} className="text-white fill-white" />
            <span className="hidden xl:block text-xl font-bold">الرسائل</span>
          </Link>
        </div>

        {/* Messages Sidebar */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-l border-zinc-800 flex flex-col h-full ${isRoot ? 'block' : 'hidden md:flex'}`}>
          <MessagesSidebar />
        </div>

        {/* Active Chat Window */}
        <div className={`flex-1 flex flex-col h-full bg-black ${isRoot ? 'hidden md:flex' : 'flex'}`}>
          {children}
        </div>
        
      </div>
      
      {/* Bottom Nav - Hidden on Desktop since we have Main Side Menu */}
      <div className={`z-50 md:hidden ${isRoot ? 'block' : 'hidden'}`}>
        <BottomNav activeTab="messages" />
      </div>
    </div>
  );
}
