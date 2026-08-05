'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Bell, Mail, User, Send, Heart, MessageCircle, Repeat, Share, Feather, Users, Quote } from 'lucide-react';
import CoffeeButton from '../../components/CoffeeButton';
import PostItem from '../../components/PostItem';
import BottomNav from '../../components/BottomNav';

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [isBookmarksModalOpen, setIsBookmarksModalOpen] = useState(false);
  const [bookmarksList, setBookmarksList] = useState<any[]>([]);
  const [selectedQuotePost, setSelectedQuotePost] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      setCurrentUsername(payload.username);
      
      fetch(`https://queen-app-api.onrender.com/users/${payload.username}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.profile?.avatarUrl) {
          setCurrentUserAvatar(data.profile.avatarUrl);
        }
      })
      .catch(console.error);
    } catch(e) {}
    fetchPosts(token, feedType);
  }, [router, feedType]);

  const fetchPosts = async (token: string, type: 'all' | 'following') => {
    try {
      setIsLoading(true);
      const url = type === 'following' ? 'https://queen-app-api.onrender.com/posts?followingOnly=true' : 'https://queen-app-api.onrender.com/posts';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else if (res.status === 401) {
        localStorage.removeItem('token');
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const fetchBookmarksAndOpenModal = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('https://queen-app-api.onrender.com/users/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setBookmarksList(await res.json());
        setIsBookmarksModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPost.trim() && !mediaFile && !selectedQuotePost) return;
    const token = localStorage.getItem('token');
    try {
      let mediaUrl = null;
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadRes = await fetch('https://queen-app-api.onrender.com/posts/media', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          mediaUrl = uploadData.mediaUrl;
        }
      }

      const res = await fetch('https://queen-app-api.onrender.com/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newPost, mediaUrl, quotePostId: selectedQuotePost?.id }),
      });
      if (res.ok) {
        setNewPost('');
        setMediaFile(null);
        setMediaPreview(null);
        setSelectedQuotePost(null);
        setIsComposeOpen(false);
        fetchPosts(token!, feedType);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen bg-black">
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 px-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-cyan-500">Gemini Social</h2>
          <div className="flex items-center gap-4">
            <button onClick={handleLogout} className="text-red-400 text-xs font-bold hover:underline">تسجيل الخروج</button>
            <Link href={`/${currentUsername}`} className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors border border-slate-700 overflow-hidden">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} />
              )}
            </Link>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-black/80 backdrop-blur-md sticky top-[60px] z-10">
          <button 
            onClick={() => setFeedType('all')}
            className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${feedType === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            لك
            {feedType === 'all' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-cyan-500 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setFeedType('following')}
            className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${feedType === 'following' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            متابَعون
            {feedType === 'following' && <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-cyan-500 rounded-t-full"></div>}
          </button>
        </div>

        {/* Main Feed */}
        <main className="flex-1">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري تحميل المنشورات...</div>
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
          onClick={() => setIsComposeOpen(true)}
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

                  <div className="flex items-center gap-4 border-t border-slate-800 pt-3 mt-2">
                    <input type="file" ref={mediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
                    <button onClick={() => mediaInputRef.current?.click()} className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors" title="إرفاق صورة أو فيديو">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                    <button onClick={fetchBookmarksAndOpenModal} className="text-cyan-500 hover:bg-cyan-500/10 p-2 rounded-full transition-colors" title="اقتباس من المحفوظات">
                      <Quote size={20} />
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
                <h3 className="text-lg font-bold text-white">اختر تغريدة مقتبسة</h3>
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
                      <div className="font-bold text-white text-sm">{post.author.username}</div>
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
    </div>
  );
}
