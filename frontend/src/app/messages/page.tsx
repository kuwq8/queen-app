'use client';

import { MessageCircle } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { usePathname } from 'next/navigation';

export default function MessagesPage() {
  const pathname = usePathname();
  // On desktop, this shows up in the right panel when no chat is selected.
  // On mobile, the layout handles showing the sidebar only, so this is hidden.
  return (
    <>
      <div className="hidden md:flex flex-col items-center justify-center h-full text-slate-500">
        <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-6">
          <MessageCircle size={48} className="text-slate-700" />
        </div>
        <h3 className="text-white text-2xl font-bold mb-2">اختر رسالة</h3>
        <p className="text-sm">اختر من رسائلك الحالية، أو ابدأ محادثة جديدة.</p>
      </div>
      
      {/* Show BottomNav on mobile when on the root messages page */}
      <div className="md:hidden">
         <BottomNav activeTab="messages" />
      </div>
    </>
  );
}
