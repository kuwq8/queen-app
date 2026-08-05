'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, UserCheck, ArrowRight, User } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.sub);
    } catch(e) {}
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`https://queen-app-api.onrender.com/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToProfile = (username: string) => {
    router.push(`/${username}`);
  };

  return (
    <div className="min-h-screen flex justify-center bg-black text-right font-sans">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen bg-black">
        
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md p-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors sm:hidden">
              <ArrowRight size={20} className="text-white" />
            </button>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="البحث عن مستخدمين..."
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-full py-2 pr-11 pl-4 focus:outline-none focus:border-cyan-500 transition-colors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
             <div className="flex justify-center p-8">
               <div className="animate-pulse text-cyan-500 font-bold">جاري البحث...</div>
             </div>
          ) : query && results.length === 0 ? (
             <div className="text-center p-12 text-slate-500 font-bold">
               لا يوجد مستخدمين باسم "{query}"
             </div>
          ) : !query ? (
             <div className="flex flex-col items-center justify-center p-16 text-slate-600">
               <Search size={48} className="mb-4 opacity-50" />
               <p className="font-bold text-center">ابحث عن الأصدقاء والمبدعين والأشخاص المثيرين للاهتمام.</p>
             </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {results.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => navigateToProfile(user.username)}
                  className="flex items-center gap-3 p-4 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {user.profile?.avatarUrl ? (
                      <img src={user.profile.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-[15px] truncate">
                      {user.profile?.firstName} {user.profile?.lastName}
                    </h3>
                    <p className="text-slate-500 text-sm truncate" dir="ltr">@{user.username}</p>
                    {user.profile?.bio && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-1">{user.profile.bio}</p>
                    )}
                  </div>
                  {user.id !== currentUserId && (
                    <button className="px-4 py-1.5 rounded-full border border-slate-700 hover:bg-slate-800 text-white text-sm font-bold transition-colors">
                      عرض
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav activeTab="explore" />
      </div>
    </div>
  );
}
