'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, ArrowRight, User, Hash, MessageSquare, X } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import PostItem from '../../components/PostItem';
import { createClient } from '@/utils/supabase/client';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams?.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'posts' | 'accounts' | 'tags'>('posts');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  
  // Trending Tags Mock (we can compute this dynamically if we have a robust backend, but simple for now)
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('posts')
        .select('content')
        .gte('created_at', twelveHoursAgo)
        .not('content', 'is', null);
      
      if (data) {
        const tagCounts: Record<string, number> = {};
        data.forEach(post => {
          const tags = post.content.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g);
          if (tags) tags.forEach((tag: string) => {
            const normalized = tag.toLowerCase();
            tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
          });
        });
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);
        setTrendingTags(sorted);
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
      if (profile) setCurrentUsername(profile.username);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // If there's an initial query from URL (e.g., clicking a hashtag), search immediately
    if (initialQuery && !query) {
      setQuery(initialQuery);
      if (initialQuery.startsWith('#')) {
        setActiveTab('posts'); // Usually clicking a hashtag searches for posts containing it
      }
    }
  }, [initialQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const supabase = createClient();
          
          if (activeTab === 'accounts') {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, first_name, last_name, avatar_url, bio')
              .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
              .limit(20);
            setResults(data || []);
          } 
          else if (activeTab === 'posts') {
            const { data } = await supabase
              .from('posts')
              .select(`
                *,
                author:profiles!posts_author_id_fkey(id, username, avatar_url, first_name, last_name)
              `)
              .ilike('content', `%${query}%`)
              .order('created_at', { ascending: false })
              .limit(20);
            setResults(data || []);
          }
          else if (activeTab === 'tags') {
            // A simple tag search: find posts with this tag, extract the tag
            // But since we just want to show tags, we can just filter the trending list, or find distinct tags in posts.
            // For simplicity in this implementation, we will search posts and show the query if it starts with #
            const searchQ = query.startsWith('#') ? query : '#' + query;
            const { data } = await supabase
              .from('posts')
              .select('content')
              .ilike('content', `%${searchQ}%`)
              .limit(50);
              
            // Basic hashtag extraction to find matching tags
            const foundTags = new Set<string>();
            data?.forEach(post => {
              const tags = post.content.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g);
              if (tags) {
                tags.forEach((tag: string) => {
                  if (tag.toLowerCase().includes(query.toLowerCase().replace('#', ''))) {
                    foundTags.add(tag);
                  }
                });
              }
            });
            
            if (foundTags.size === 0 && query.startsWith('#')) foundTags.add(query);
            setResults(Array.from(foundTags).map(tag => ({ tag })));
          }

        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeTab]);

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-cyan-500/30 text-right" dir="rtl">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen">
        
        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md p-3 px-4 flex flex-col gap-3 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-white p-2 rounded-full hover:bg-slate-800 transition-colors -mr-2">
              <ArrowRight size={20} />
            </button>
            <div className="flex-1 relative">
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon size={18} />
              </div>
              <input 
                type="text"
                placeholder="ابحث في Gemini Social..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-full py-2.5 pr-10 pl-4 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-sm"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex w-full mt-1 border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors relative flex justify-center gap-2 ${activeTab === 'posts' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <MessageSquare size={16} /> أحدث المنشورات
              {activeTab === 'posts' && <div className="absolute bottom-0 w-12 h-1 bg-cyan-500 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('accounts')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors relative flex justify-center gap-2 ${activeTab === 'accounts' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <User size={16} /> الحسابات
              {activeTab === 'accounts' && <div className="absolute bottom-0 w-12 h-1 bg-cyan-500 rounded-t-full" />}
            </button>
            <button 
              onClick={() => setActiveTab('tags')}
              className={`flex-1 pb-3 text-sm font-bold transition-colors relative flex justify-center gap-2 ${activeTab === 'tags' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Hash size={16} /> الهاشتاقات
              {activeTab === 'tags' && <div className="absolute bottom-0 w-12 h-1 bg-cyan-500 rounded-t-full" />}
            </button>
          </div>
        </header>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty State / Trending */}
          {!query.trim() && (
            <div className="p-4">
              <h2 className="font-bold text-xl mb-4 text-white">الوسوم المتداولة</h2>
              <div className="flex flex-col gap-1">
                {trendingTags.map((tag, i) => (
                  <div 
                    key={tag}
                    onClick={() => {
                      setQuery(tag);
                      setActiveTab('posts');
                    }}
                    className="p-3 hover:bg-slate-900 rounded-xl cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">المتداول رقم {i+1}</span>
                      <span className="font-bold text-white text-[15px] group-hover:text-cyan-500 transition-colors">{tag}</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-600 rotate-180" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Searching State */}
          {isSearching && query.trim() && (
            <div className="flex justify-center p-8">
              <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري البحث...</div>
            </div>
          )}
          
          {/* No Results State */}
          {!isSearching && query.trim() && results.length === 0 && (
            <div className="text-center p-12 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 text-slate-600">
                <SearchIcon size={32} />
              </div>
              <p className="font-bold text-lg text-white mb-2">لا توجد نتائج لـ "{query}"</p>
              <p className="text-sm text-slate-500">جرب البحث بكلمات أخرى أو تحقق من الإملاء.</p>
            </div>
          )}

          {/* Results List */}
          {!isSearching && results.length > 0 && (
            <div className="flex flex-col">
              {activeTab === 'accounts' && results.map((user) => (
                <Link key={user.id} href={`/${user.username}`} className="flex items-center gap-3 p-4 border-b border-slate-800/50 hover:bg-slate-900 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-white text-[15px] truncate">
                      {user.first_name ? `${user.first_name} ${user.last_name||''}` : user.username}
                    </span>
                    <span className="text-slate-500 text-[13px] truncate">@{user.username}</span>
                    {user.bio && <p className="text-slate-300 text-sm mt-1 truncate">{user.bio}</p>}
                  </div>
                </Link>
              ))}

              {activeTab === 'posts' && results.map((post) => (
                <div key={post.id} className="border-b border-slate-800/50">
                  <PostItem 
                    post={post} 
                    currentUsername={currentUsername}
                    onPostDeleted={() => {
                      setResults(prev => prev.filter(p => p.id !== post.id));
                    }}
                    onPostEdited={(id, newContent) => {
                      setResults(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
                    }}
                  />
                </div>
              ))}

              {activeTab === 'tags' && results.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setQuery(item.tag);
                    setActiveTab('posts');
                  }}
                  className="p-4 hover:bg-slate-900 rounded-xl cursor-pointer transition-colors flex items-center justify-between border-b border-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-cyan-500">
                      <Hash size={20} />
                    </div>
                    <span className="font-bold text-white text-[16px]">{item.tag}</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 rotate-180" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav activeTab="explore" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
