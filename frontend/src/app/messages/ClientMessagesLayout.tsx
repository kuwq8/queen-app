'use client';

import { usePathname } from 'next/navigation';
import MessagesSidebar from './MessagesSidebar';
import BottomNav from '../../components/BottomNav';

export default function ClientMessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="fixed inset-0 z-[40] flex justify-center bg-black font-sans text-right" dir="rtl">
      {/* General Container - exactly like Home page (max-w-lg) */}
      <div className="w-full max-w-md sm:max-w-lg flex flex-col relative min-h-screen bg-black border-x border-zinc-800 shadow-2xl overflow-hidden">
        
        {/* If we are on /messages, show Sidebar. Otherwise show the Chat window (children) */}
        <div className={`flex-1 flex-col w-full h-full pb-14 ${isRoot ? 'flex' : 'hidden'}`}>
          <MessagesSidebar />
        </div>

        <div className={`flex-1 flex-col w-full h-full ${isRoot ? 'hidden' : 'flex'}`}>
          {children}
        </div>
        
      </div>
      
      {/* Bottom Nav - Centered perfectly */}
      <div className={`z-50 ${isRoot ? 'block' : 'hidden'}`}>
        <BottomNav activeTab="messages" />
      </div>
    </div>
  );
}
