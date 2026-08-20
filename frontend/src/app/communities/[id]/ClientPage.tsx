'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Image as ImageIcon, Users, User, Feather } from 'lucide-react';
import Link from 'next/link';
import PostItem from '../../../components/PostItem';
import BottomNav from '../../../components/BottomNav';

export default function CommunityPage({ params }: { params: any }) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const id = resolvedParams.id;
  const router = useRouter();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [newPost, setNewPost] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const fetchCommunityData = async () => {
    try {
      setIsLoading(true);
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setCurrentUsername(profile.username);
        setCurrentUserAvatar(profile.avatar_url);
      }

      // Fetch Community
      const { data: comm, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (commError || !comm) {
        setCommunity(null);
        return;
      }
      setCommunity(comm);

      // Check membership
      const { data: member } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsMember(!!member);

      // Fetch Posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(username, avatar_url),
          community:communities!community_id(name)
        `)
        .eq('community_id', id)
        .order('created_at', { ascending: false });

      if (postsData && session) {
        const postIds = postsData.map(p => p.id);
        
        const [likesRes, repostsRes, bookmarksRes] = await Promise.all([
          supabase.from('likes').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('reposts').select('post_id').eq('user_id', session.user.id).in('post_id', postIds),
          supabase.from('bookmarks').select('post_id').eq('user_id', session.user.id).in('post_id', postIds)
        ]);

        const likedIds = new Set(likesRes.data?.map(l => l.post_id) || []);
        const repostedIds = new Set(repostsRes.data?.map(r => r.post_id) || []);
        const bookmarkedIds = new Set(bookmarksRes.data?.map(b => b.post_id) || []);

        const enhancedPosts = postsData.map(p => ({
          ...p,
          isLiked: likedIds.has(p.id),
          isReposted: repostedIds.has(p.id),
          isBookmarked: bookmarkedIds.has(p.id)
        }));
        setPosts(enhancedPosts);
      } else if (postsData) {
        setPosts(postsData);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMembership = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isMember) {
        // Leave
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', session.user.id);
        
        setIsMember(false);
        setCommunity((prev: any) => ({ ...prev, members_count: Math.max(0, prev.members_count - 1) }));
      } else {
        // Join
        await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: session.user.id
          });
        
        setIsMember(true);
        setCommunity((prev: any) => ({ ...prev, members_count: prev.members_count + 1 }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          user_id: session.user.id,
          community_id: community.id
        });

      if (!error) {
        setNewPost('');
        setIsComposeOpen(false);
        fetchCommunityData(); // Refresh posts
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center bg-black font-sans text-right">
        <div className="w-full max-w-[600px] border-x border-slate-800 animate-pulse bg-[#0a0a0f]">
          <div className="h-32 bg-slate-900"></div>
          <div className="p-4">
             <div className="w-24 h-24 rounded-full bg-slate-800 -mt-12 mb-4 border-4 border-black"></div>
             <div className="w-48 h-6 bg-slate-800 rounded mb-2"></div>
             <div className="w-full h-4 bg-slate-800 rounded mb-1"></div>
             <div className="w-3/4 h-4 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans text-right">
        <h1 className="text-2xl font-bold mb-4">القناة غير موجود</h1>
        <button onClick={() => router.push('/home')} className="text-cyan-500 hover:underline">العودة للرئيسية</button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 py-2 gap-6 border-b border-slate-800/50">
        <button onClick={() => router.push('/home')} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowRight className="text-white" size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">{community.name}</h2>
          <p className="text-xs text-slate-500">{community.members_count || 0} عضو</p>
        </div>
      </header>

      {/* Community Info */}
      <div className="relative border-b border-slate-800 pb-4">
        <div className="h-32 sm:h-48 bg-gradient-to-r from-sky-900 via-slate-900 to-slate-900 relative">
          {community.cover_url && (
            <img src={community.cover_url} alt="Cover" className="w-full h-full object-cover opacity-80" />
          )}
        </div>
        
        <div className="px-4">
          <div className="flex justify-between items-start">
            <div className="-mt-12 sm:-mt-16 relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-black border-4 border-black flex items-center justify-center overflow-hidden">
                {community.avatar_url ? (
                  <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-4xl text-slate-300">
                    {community.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <button 
                onClick={toggleMembership}
                className={`px-5 py-1.5 rounded-full font-bold text-[15px] border transition-colors ${
                  isMember 
                    ? 'border-slate-600 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 group' 
                    : 'bg-white text-black hover:bg-slate-200 border-transparent'
                }`}
              >
                {isMember ? <span className="group-hover:hidden">عضو</span> : 'انضمام'}
                {isMember && <span className="hidden group-hover:inline">مغادرة</span>}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <h1 className="text-xl font-bold text-white">{community.name}</h1>
            <p className="text-[15px] text-slate-300 mt-2 leading-relaxed">
              {community.description || 'لا يوجد وصف لهذا القناة.'}
            </p>
            <div className="flex items-center text-slate-500 text-[14px] mt-3 gap-2">
              <Users size={16} />
              <span className="font-bold text-white">{community.members_count || 0}</span> عضواً
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <main className="flex-1">
        {!isMember ? (
          <div className="text-center p-12 text-slate-500 flex flex-col items-center">
            <Users size={48} className="text-slate-800 mb-4" />
            <h3 className="text-white text-lg font-bold mb-2">انضم للقناة للمشاركة</h3>
            <p className="text-sm">يجب أن تكون عضواً لتتمكن من رؤية المنشورات والمشاركة فيها.</p>
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
                لا توجد منشورات بعد في هذا القناة. كن أول من يشارك!
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {currentUserId === community?.creator_id && (
        <button 
          onClick={() => setIsComposeOpen(true)}
          className="absolute bottom-20 left-4 bg-sky-600 hover:bg-sky-500 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-sky-500/30 z-40 transition-colors"
        >
          <Feather size={24} />
        </button>
      )}

      {/* Compose Post Modal Overlay */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-start pt-16 px-4">
          <div className="bg-[#111] w-full max-w-[600px] rounded-2xl border border-slate-800 p-4 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <button 
                onClick={() => handlePostSubmit()}
                disabled={!newPost.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-1.5 text-sm rounded-full disabled:opacity-50 transition-colors"
              >
                نشر في القناة
              </button>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                ✕
              </button>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 border border-slate-700 overflow-hidden">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1">
                <textarea 
                  className="w-full bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none resize-none pt-1"
                  placeholder={`شارك أفكارك في ${community.name}...`}
                  rows={4}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab={'' as any} />
    </div>
  );
}
