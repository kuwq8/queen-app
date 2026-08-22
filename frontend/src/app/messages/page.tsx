'use client';

import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-zinc-500 bg-black">
      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mb-4">
        <MessageCircle size={32} />
      </div>
      <h3 className="text-white text-2xl font-bold mb-2">اختر رسالة</h3>
      <p className="text-zinc-500 text-sm">اختر من رسائلك الحالية، أو ابدأ محادثة جديدة.</p>
    </div>
  );
}
