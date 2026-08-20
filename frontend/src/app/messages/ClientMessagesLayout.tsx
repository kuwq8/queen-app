'use client';

import { usePathname } from 'next/navigation';
import MessagesSidebar from './MessagesSidebar';

export default function ClientMessagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRoot = pathname === '/messages';

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-right" dir="rtl">
      {/* Sidebar - hidden on mobile when not root */}
      <div className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-l border-slate-800 ${isRoot ? 'block' : 'hidden md:block'}`}>
        <MessagesSidebar />
      </div>

      {/* Main Content (Chat) - hidden on mobile when root */}
      <div className={`flex-1 flex flex-col h-full bg-[#0a0a0a] ${isRoot ? 'hidden md:flex' : 'flex'}`}>
        {children}
      </div>
    </div>
  );
}
