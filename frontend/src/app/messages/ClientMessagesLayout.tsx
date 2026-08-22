'use client';

import { usePathname } from 'next/navigation';
import MessagesSidebar from './MessagesSidebar';
import BottomNav from '../../components/BottomNav';

export default function ClientMessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="fixed inset-0 z-[40] bg-black font-sans text-right" dir="rtl">
      {/* General Container matching user request */}
      <div className="max-w-6xl mx-auto h-screen flex border-x border-zinc-800 relative">
        
        {/* Messages Sidebar */}
        <div className={`w-full md:w-[380px] lg:w-[420px] border-l border-zinc-800 shrink-0 h-full overflow-y-auto ${isRoot ? 'block' : 'hidden md:block'}`}>
          <MessagesSidebar />
        </div>

        {/* Active Chat Window */}
        <div className={`flex-1 flex flex-col h-full bg-black md:pb-14 ${isRoot ? 'hidden md:flex items-center justify-center' : 'flex'}`}>

          {children}
        </div>
        
      </div>
      
      {/* Bottom Nav - Always centered at the bottom of the screen */}
      <div className={`z-50 md:block ${isRoot ? 'block' : 'hidden'}`}>
        <BottomNav activeTab="messages" />
      </div>
    </div>
  );
}
