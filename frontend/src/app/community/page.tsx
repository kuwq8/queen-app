'use client';

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
    const init = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return router.push('/');
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      setCurrentUser(profile);
      fetchData(session.user.id);
    };
    init();
  }, [router]);

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      // Fetch all public channels/servers
      const { data: allChannels } = await supabase
        .from('channels')
        .select('*')
        .eq('is_group', true);

      // Fetch my memberships
      const { data: myMemberships } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', userId);

      const myChannelIds = myMemberships?.map(m => m.channel_id) || [];
      
      const formattedServers = (allChannels || []).map(ch => ({
        id: ch.id,
        name: ch.name,
        slug: ch.id,
        bannerUrl: null,
      }));

      setServers(formattedServers);
      setMyServers(formattedServers.filter(s => myChannelIds.includes(s.id)));

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinServer = async (slug: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const isJoined = myServers.some(s => s.id === slug);
      if (!isJoined) {
        await supabase
          .from('channel_members')
          .insert({ channel_id: slug, user_id: session.user.id });
      }
      
      router.push(`/c/${slug}/chat`);
    } catch (err) {
      console.error(err);
      router.push(`/c/${slug}/chat`);
    }
  };

  useEffect(() => {
    if (!query) return;
    const delayDebounceFn = setTimeout(async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data } = await supabase
        .from('channels')
        .select('*')
        .eq('is_group', true)
        .ilike('name', `%${query}%`);
        
      if (data) {
        setServers(data.map(ch => ({
          id: ch.id,
          name: ch.name,
          slug: ch.id,
          bannerUrl: null,
        })));
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
              placeholder="البحث في المجتمعات..."
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
                        onJoin={(slug) => handleJoinServer(slug)} 
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
                          onJoin={(slug) => handleJoinServer(slug)} 
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
