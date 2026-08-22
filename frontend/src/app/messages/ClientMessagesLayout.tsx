'use client';

import { usePathname } from 'next/navigation';
import MessagesSidebar from './MessagesSidebar';
import BottomNav from '../../components/BottomNav';

export default function ClientMessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="fixed inset-0 z-[40] flex h-screen w-full bg-black overflow-hidden font-sans text-right justify-center" dir="rtl">
      {/* General Container matching Twitter max width */}
      <div className="flex h-screen w-full max-w-7xl mx-auto overflow-hidden relative">
        
        {/* Messages Sidebar */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-l border-zinc-800 flex flex-col h-full ${isRoot ? 'block' : 'hidden md:flex'}`}>
          <MessagesSidebar />
        </div>

        {/* Active Chat Window */}
        <div className={`flex-1 flex flex-col h-full bg-black ${isRoot ? 'hidden md:flex' : 'flex'}`}>
          {children}
        </div>
        
      </div>
      
      {/* Bottom Nav */}
      <div className={`z-50 md:block ${isRoot ? 'block' : 'hidden'}`}>
        <BottomNav activeTab="messages" />
      </div>
    </div>
  );
}
