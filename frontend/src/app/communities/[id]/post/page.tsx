'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Camera, Image as ImageIcon } from 'lucide-react';

export default function CommunityPostPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id;
  
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    // Mock successful post, route back to community
    router.push(`/communities/${communityId}`);
  };

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors">
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-bold text-white">نشر في المجتمع</h2>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!content.trim()}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-bold px-5 py-1.5 rounded-full transition-colors"
        >
          نشر
        </button>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 animate-fade-in-up">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-700">
            {/* Mock User Avatar */}
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 pt-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="شارك أفكارك أو صورك مع أعضاء المجتمع..."
              className="w-full bg-transparent text-white text-lg placeholder-slate-500 focus:outline-none resize-none min-h-[150px]"
              autoFocus
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4 mt-2 flex items-center gap-4">
          <button className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors">
            <ImageIcon size={22} />
          </button>
          <button className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors">
            <Camera size={22} />
          </button>
        </div>
      </main>
    </div>
  );
}
