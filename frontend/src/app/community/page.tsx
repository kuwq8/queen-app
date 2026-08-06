'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, ArrowRight } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import ServerCard from '../../components/ServerCard';

export default function CommunityPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [servers, setServers] = useState<any[]>([]);
  const [myServers, setMyServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return router.push('/');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUser(payload);
    } catch(e) {}
    fetchData(token);
  }, []);

  const handleJoinServer = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    const token = getToken();
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/community/${slug}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      // Navigate to chat whether newly joined or already joined
      router.push(`/c/${slug}/chat`);
    } catch (err) {
      console.error(err);
      router.push(`/c/${slug}/chat`);
    }
  };

  const fetchData = async (token: string) => {
    setIsLoading(true);
    try {
      const [allRes, myRes] = await Promise.all([
        fetch(`${API_URL}/community`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/community/my-servers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (allRes.ok) setServers(await allRes.json());
      if (myRes.ok) setMyServers(await myRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const token = getToken();
      if (token) {
        fetch(`${API_URL}/community?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setServers(data))
        .catch(console.error)
        .finally(() => setIsLoading(false));
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen bg-black">
        
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
                <ArrowRight size={20} className="text-white" />
              </button>
              <h1 className="text-xl font-bold text-cyan-500">مجتمعات السيرفرات</h1>
            </div>
            <button 
              onClick={() => router.push('/community/create')}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
            >
              <Plus size={16} />
              <span>إنشاء</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="البحث في المجتمعات (مثل: gemini)..."
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-full py-2.5 pr-11 pl-4 focus:outline-none focus:border-cyan-500 transition-colors text-right"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse text-cyan-500 font-bold">جاري التحميل...</div>
            </div>
          ) : (
            <>
              {/* My Servers */}
              {!query && myServers.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">السيرفرات المنضم إليها</h2>
                  <div className="grid gap-3">
                    {myServers.map(server => (
                      <ServerCard 
                        key={server.id} 
                        server={server} 
                        isJoined={true} 
                        onJoin={(slug) => handleJoinServer({ stopPropagation: () => {} } as any, slug)} 
                        currentUser={currentUser} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Discover Servers */}
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                  {query ? 'نتائج البحث' : 'اكتشف'}
                </h2>
                {servers.length === 0 ? (
                  <div className="text-center p-8 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800/50 font-bold">
                    لم يتم العثور على مجتمعات.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {servers.map(server => {
                      const isJoined = myServers.some(m => m.id === server.id);
                      return (
                        <ServerCard 
                          key={server.id} 
                          server={server} 
                          isJoined={isJoined} 
                          onJoin={(slug) => handleJoinServer({ stopPropagation: () => {} } as any, slug)} 
                          currentUser={currentUser} 
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <BottomNav activeTab="" />
      </div>
    </div>
  );
}
