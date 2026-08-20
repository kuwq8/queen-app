'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, ArrowRight } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import PostItem from '../../components/PostItem';

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  
  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (data) setCurrentUsername(data.username);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        if (activeTab === 'users') {
          searchUsers(query);
        } else {
          searchPosts(query);
        }
      } else {
        setUserResults([]);
        setPostResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  const searchUsers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .limit(20);
        
      if (!error && data) {
        setUserResults(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPosts = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_user_id_fkey(id, username, avatar_url)')
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (!error && data) {
        let enhancedPosts = data;
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const postIds = data.map(p => p.id);
          const [likesRes, repostsRes, bookmarksRes] = await Promise.all([
            supabase.from('likes').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
            supabase.from('reposts').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
            supabase.from('bookmarks').select('post_id').eq('user_id', session.user.id).in('post_id', postIds)
          ]);
          
          const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
          const repostedIds = new Set(repostsRes.data?.map(r => r.post_id) || []);
          const bookmarkedIds = new Set(bookmarksRes.data?.map(b => b.post_id) || []);
          
          enhancedPosts = data.map(p => ({
            ...p,
            isLiked: likedIds.has(p.id),
            isReposted: repostedIds.has(p.id),
            isBookmarked: bookmarkedIds.has(p.id)
          }));
        }
        setPostResults(enhancedPosts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-black text-right font-sans relative pb-[60px]">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black">
        
        <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md pt-3 border-b border-slate-800">
          <div className="flex items-center gap-3 px-3 pb-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="البحث عن مستخدمين أو كلمات مفتاحية..."
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-full py-2 pr-11 pl-4 focus:outline-none focus:border-cyan-500 transition-colors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                dir="rtl"
              />
            </div>
          </div>
          
          <div className="flex border-t border-slate-800">
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              المستخدمين
            </button>
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'posts' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
            >
              المنشورات
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" dir="rtl">
          {isLoading ? (
             <div className="flex justify-center p-8">
               <div className="animate-pulse text-cyan-500 font-bold">جاري البحث...</div>
             </div>
          ) : query && activeTab === 'users' && userResults.length === 0 ? (
             <div className="text-center p-12 text-slate-500 font-bold">
               لا يوجد مستخدمين باسم "{query}"
             </div>
          ) : query && activeTab === 'posts' && postResults.length === 0 ? (
             <div className="text-center p-12 text-slate-500 font-bold">
               لا توجد منشورات تحتوي على "{query}"
             </div>
          ) : !query ? (
             <div className="flex flex-col items-center justify-center p-16 text-slate-600">
               <Search size={48} className="mb-4 opacity-50" />
               <p className="font-bold text-center">ابحث عن الأصدقاء والمبدعين والأشخاص المثيرين للاهتمام.</p>
             </div>
          ) : activeTab === 'users' ? (
            <div className="divide-y divide-slate-800/50">
              {userResults.map((user) => (
                <div 
                  key={user.id} 
                  onClick={() => router.push(`/${user.username}`)}
                  className="flex items-center gap-3 p-4 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-[15px] truncate">
                      {user.username}
                    </h3>
                    <p className="text-slate-500 text-sm truncate" dir="ltr">@{user.username}</p>
                    {user.bio && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-1">{user.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {postResults.map((post) => (
                <PostItem 
                  key={post.id} 
                  post={post} 
                  currentUsername={currentUsername} 
                  onPostDeleted={(id) => setPostResults(prev => prev.filter(p => p.id !== id))}
                  onPostEdited={(id, content) => setPostResults(prev => prev.map(p => p.id === id ? { ...p, content } : p))}
                />
              ))}
            </div>
          )}
        </div>

        <BottomNav activeTab="explore" />
      </div>
    </div>
  );
}
