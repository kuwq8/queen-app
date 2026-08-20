'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, Compass, Bell, Mail, Home, Search, Feather, MoreHorizontal, MessageCircle, Repeat, Heart, Share, Play, PlaySquare, Eye, X, Image as ImageIcon, Sparkles, LogOut, Coffee, Hash, ImagePlus, UserPlus, Users, MessageSquareOff, User, Quote, Plus } from 'lucide-react';
import CoffeeButton from '../../components/CoffeeButton';
import PostItem from '../../components/PostItem';
import BottomNav from '../../components/BottomNav';

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<'all' | 'following' | 'communities'>('all');
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [localCommunities, setLocalCommunities] = useState<any[]>([]);
  const [disableComments, setDisableComments] = useState(false);
  const fetchIdRef = useRef(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 20;

  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [bookmarksList, setBookmarksList] = useState<any[]>([]);
  const [selectedQuotePost, setSelectedQuotePost] = useState<any>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (!session) {
          router.push('/');
          return;
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, is_onboarded')
          .eq('id', session.user.id)
          .single();
          
        if (profile && isMounted) {
          if (profile.is_onboarded === false) {
            router.push('/onboarding');
            return;
          }
          setCurrentUsername(profile.username);
          setCurrentUserAvatar(profile.avatar_url);
        }
        if (isMounted) fetchPosts();
      } catch (err) {
        console.error(err);
      }
    };
    checkAuth();
    
    if (feedType === 'communities') {
      fetchCommunities();
    }
    
    return () => {
      isMounted = false;
    };
  }, [router, feedType]);

  const fetchCommunities = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data, error } = await supabase
        .from('communities')
        .select('*, is_onboarded')
        .order('members_count', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setLocalCommunities(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (page > 0) fetchPosts(page);
  }, [page]);

  const fetchPosts = async (pageNum = 0) => {
    const fetchId = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setError(null);
      
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(pageNum * POSTS_PER_PAGE, (pageNum + 1) * POSTS_PER_PAGE - 1);

      if (feedType === 'following') {
        if (!session) {
          if (fetchId === fetchIdRef.current) {
            setPosts([]);
            setIsLoading(false);
          }
          return;
        }
        const { data: followsData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', session.user.id);
          
        const followingIds = followsData?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          if (fetchId === fetchIdRef.current) {
            setPosts([]);
            setIsLoading(false);
          }
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let finalPosts = data || [];
      
      // Fetch current user's interactions
      if (session && finalPosts.length > 0) {
        const postIds = finalPosts.map(p => p.id);
        
        const [likesRes, repostsRes, bookmarksRes] = await Promise.all([
          supabase.from('likes').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('reposts').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('bookmarks').select('post_id').eq('user_id', session.user.id).in('post_id', postIds)
        ]);
        
        const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const repostedIds = new Set(repostsRes.data?.map(r => r.post_id) || []);
        const bookmarkedIds = new Set(bookmarksRes.data?.map(b => b.post_id) || []);
        
        finalPosts = finalPosts.map(p => ({
          ...p,
          isLiked: likedIds.has(p.id),
          isReposted: repostedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id)
        }));
      }

      if (fetchId === fetchIdRef.current) {
        if (finalPosts.length < POSTS_PER_PAGE) setHasMore(false);
        if (pageNum === 0) {
          setPosts(finalPosts);
        } else {
          setPosts(prev => [...prev, ...finalPosts]);
        }
      }
    } catch (err) {
      console.error(err);
      if (fetchId === fetchIdRef.current) {
        setError('حدث خطأ أثناء الاتصال بالخادم.');
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const searchGifs = async (query: string) => {
    try {
      const url = query.trim() 
        ? `https://tenor.googleapis.com/v2/search?q=${query}&key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'}&client_key=gemini_social&limit=20`
        : `https://tenor.googleapis.com/v2/featured?key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'}&client_key=gemini_social&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setGifs(data.results);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showGifPicker) searchGifs(gifSearch);
  }, [gifSearch, showGifPicker]);

  useEffect(() => {
    let channel: any;
    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      channel = supabase.channel('home-posts')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        })
        .subscribe((status) => console.log('Home Realtime Status:', status));
    };
    
    setupRealtime();
    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setShowGifPicker(false);
    }
  };

  const fetchBookmarksAndOpenModal = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('bookmarks')
        .select(`
          post:posts (
            id,
            content,
            author:profiles!posts_user_id_fkey(username)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        setBookmarksList(data.map(b => b.post));
      }
    } catch (e) {
      console.error(e);
    }
    setIsBookmarksModalOpen(true);
  };

  const handlePostSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPost.trim() && !mediaFile && !mediaPreview && !selectedQuotePost) return;
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      let mediaUrl = mediaPreview && mediaPreview.startsWith('http') ? mediaPreview : null;
      
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_media')
          .upload(filePath, mediaFile);
          
        if (uploadError) {
          console.error('Error uploading media:', uploadError);
        } else {
          const { data } = supabase.storage.from('post_media').getPublicUrl(filePath);
          mediaUrl = data.publicUrl;
        }
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          media_url: mediaUrl,
          user_id: session.user.id,
          is_comments_disabled: disableComments
        });

      if (!error) {
        setNewPost('');
        setMediaFile(null);
        setMediaPreview(null);
        setSelectedQuotePost(null);
        setDisableComments(false);
        setIsComposeOpen(false);
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostEdited = (postId: string, newContent: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content: newContent } : p));
  };

  const handleLogout = async () => {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
        
        {/* Top Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-cyan-500">Gemini Social</h2>
            <Link href="/settings" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="text-red-400 text-xs font-bold hover:underline">تسجيل الخروج</button>
            <Link href={`/${currentUsername}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700 overflow-hidden">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </Link>
          </div>
        </header>

        {/* Tabs - Pill Style */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 bg-black/80 backdrop-blur-md sticky top-[60px] z-40 px-4 py-3 [&::-webkit-scrollbar]:hidden">
          <button 
            onClick={() => setFeedType('all')}
            className={`whitespace-nowrap px-4 py-1.5 text-sm font-bold rounded-full transition-all ${feedType === 'all' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            لك
          </button>
          <button 
            onClick={() => setFeedType('following')}
            className={`whitespace-nowrap px-4 py-1.5 text-sm font-bold rounded-full transition-all ${feedType === 'following' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            متابَعون
          </button>
          <button 
            onClick={() => setFeedType('communities')}
            className={`whitespace-nowrap px-4 py-1.5 text-sm font-bold rounded-full transition-all flex items-center gap-1.5 ${feedType === 'communities' ? 'bg-white text-black' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            <Users size={16} /> المجتمعات
          </button>
        </div>

        {/* Main Feed */}
        <main className="flex-1">
          {feedType === 'communities' ? (
             <div className="flex flex-col gap-3 p-4 animate-fade-in-up">
                <div className="flex items-center justify-between gap-2 px-1 pb-2 w-full mx-auto border-b border-white/5 mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="text-white/70" size={20} />
                    <h1 className="text-xl font-bold text-white">المجتمعات</h1>
                  </div>
                  <Link href="/communities/create" className="text-sky-500 hover:text-sky-400 text-sm font-medium flex items-center gap-1">
                    <Plus size={16} />أنشئ مجتمعاً
                  </Link>
                </div>
                {localCommunities.length > 0 ? localCommunities.map((community) => (
                  <Link href={`/communities/${community.id}`} key={community.id} className="block group">
                    <div className="flex items-center justify-between p-4 bg-[#111] border border-slate-800 rounded-2xl hover:border-sky-500/20 hover:bg-slate-900/50 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 overflow-hidden">
                        {community.avatar_url ? (
                           <img src={community.avatar_url} className="w-[56px] h-[56px] rounded-full object-cover border border-slate-700 shrink-0" />
                        ) : (
                           <div className="w-[56px] h-[56px] rounded-full bg-slate-800 flex items-center justify-center font-bold text-2xl text-slate-500 shrink-0 border border-slate-700">
                             {community.name.charAt(0)}
                           </div>
                        )}
                        <div className="flex flex-col min-w-0 text-right">
                          <h4 className="font-bold text-white text-[15px] truncate">{community.name}</h4>
                          <p className="text-slate-400 text-[13px] truncate">{community.description}</p>
                          <span className="text-cyan-500 text-[11px] font-bold mt-0.5">{community.members_count || 0} عضو</span>
                        </div>
                      </div>
                      <button className="ml-2 shrink-0 bg-white/5 hover:bg-white/10 text-white font-bold text-xs px-4 py-2 rounded-full transition-colors border border-white/10 group-hover:border-sky-500/30 group-hover:text-sky-400">
                        استكشاف
                      </button>
                    </div>
                  </Link>
                )) : (
                  <div className="text-center p-12 text-slate-500 text-sm font-bold">
                    لا توجد مجتمعات بعد. كن أول من ينشئ مجتمعاً!
                  </div>
                )}
             </div>
          ) : isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري تحميل المنشورات...</div>
            </div>
          ) : error ? (
            <div className="text-center p-12 flex flex-col items-center">
              <div className="text-red-500 text-sm font-bold mb-4">{error}</div>
              <button onClick={() => fetchPosts()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">إعادة المحاولة</button>
            </div>
          ) : (
            <div>
              {posts.map((post) => (
              <PostItem 
                key={post.id} 
                post={post} 
                currentUsername={currentUsername} 
                onPostDeleted={handlePostDeleted}
                onPostEdited={handlePostEdited}
              />
            ))}
            {posts.length === 0 && (
              <div className="text-center p-12 text-slate-500 text-sm font-bold">
                لا توجد منشورات بعد. كن أول من يشارك شيئاً!
              </div>
            )}
          </div>
          )}
        </main>

        {/* Floating Action Button (FAB) */}
        <button 
          onClick={() => {
            if (feedType === 'communities') {
              router.push('/communities/post');
            } else {
              setIsComposeOpen(true);
            }
          }}
          className="absolute bottom-20 left-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-cyan-500/30 z-40 transition-colors"
        >
          <Feather size={20} />
        </button>

        {/* Compose Post Modal Overlay */}
        {isComposeOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4">
            <div className="bg-[#111] w-full max-w-[600px] rounded-2xl border border-slate-800 p-4 shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <button 
                  onClick={() => handlePostSubmit()}
                  disabled={!newPost.trim() && !mediaFile && !selectedQuotePost}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-1.5 text-sm rounded-full disabled:opacity-50 transition-colors"
                >
                  نشر
                </button>
                <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                  <span className="text-xl font-bold px-1">✕</span>
                </button>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 flex-shrink-0 overflow-hidden">
                  {currentUserAvatar ? (
                    <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="flex-1">
                  <textarea 
                    className="w-full bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none resize-none pt-1"
                    placeholder="ماذا يحدث؟!"
                    rows={4}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    autoFocus
                  />
                  {mediaPreview && (
                    <div className="relative mt-3">
                      <img src={mediaPreview} alt="Preview" className="w-full max-h-[300px] object-cover rounded-2xl border border-slate-700" />
                      <button 
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="absolute top-2 left-2 bg-black/60 text-white p-1 rounded-full hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {selectedQuotePost && (
                    <div className="relative mt-3 border border-slate-700 rounded-xl p-3 bg-slate-800/20 text-right">
                      <button 
                        onClick={() => setSelectedQuotePost(null)}
                        className="absolute top-2 left-2 text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-[13px]">{selectedQuotePost.author?.username}</span>
                      </div>
                      <p className="mt-1 text-slate-300 text-[14px] line-clamp-2">{selectedQuotePost.content}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-800 pt-3 mt-2">
                    <div className="flex items-center gap-4 relative">
                      <input id="home-file-input" type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                      <label htmlFor="home-file-input" className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center" title="إرفاق صورة أو فيديو">
                        <ImageIcon size={20} />
                      </label>
                      <button onClick={() => setShowGifPicker(!showGifPicker)} className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors flex items-center justify-center" title="إرفاق GIF">
                        <span className="border border-cyan-500 rounded px-1.5 py-0.5 text-[10px] font-bold">GIF</span>
                      </button>
                      <button onClick={fetchBookmarksAndOpenModal} className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors" title="اقتباس من السجل">
                        <Quote size={20} />
                      </button>
                      
                      {showGifPicker && (
                        <div className="absolute bottom-12 right-0 w-[300px] bg-[#111] border border-slate-700 rounded-xl shadow-2xl z-50">
                          <div className="p-2 border-b border-slate-700 flex gap-2 items-center">
                            <Search size={16} className="text-slate-400" />
                            <input 
                              type="text" 
                              placeholder="ابحث عن GIF..."
                              className="bg-transparent text-white outline-none text-sm w-full"
                              value={gifSearch}
                              onChange={e => setGifSearch(e.target.value)}
                            />
                          </div>
                          <div className="h-[250px] overflow-y-auto p-1 grid grid-cols-2 gap-1 custom-scrollbar">
                            {gifs.map(gif => (
                              <img 
                                key={gif.id} 
                                src={gif.media_formats?.tinygif?.url} 
                                alt="GIF"
                                className="w-full h-28 object-cover cursor-pointer rounded hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setMediaPreview(gif.media_formats?.gif?.url);
                                  setMediaFile(null);
                                  setShowGifPicker(false);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => setDisableComments(!disableComments)} 
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${disableComments ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      <MessageSquareOff size={14} />
                      <span>{disableComments ? 'التعليقات معطلة' : 'السماح بالتعليقات'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks Modal */}
        {isBookmarksModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4 text-right">
            <div className="bg-[#111] w-full max-w-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl animate-fade-in-up max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
                <button onClick={() => setIsBookmarksModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                  ✕
                </button>
                <h3 className="text-white font-bold mb-4">اختر تغريدة من السجل</h3>
              </div>
              <div className="overflow-y-auto flex-1 space-y-2">
                {bookmarksList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-bold">لم تقم بحفظ أي منشورات بعد.</div>
                ) : (
                  bookmarksList.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => { setSelectedQuotePost(post); setIsBookmarksModalOpen(false); }}
                      className="p-3 border border-slate-800 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-white text-sm">{post.author?.username || 'مستخدم غير معروف'}</div>
                      <div className="text-slate-300 text-sm mt-1 line-clamp-2">{post.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <BottomNav activeTab="home" />

      </div>
  );
}
