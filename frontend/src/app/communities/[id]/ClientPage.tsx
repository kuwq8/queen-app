'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Image as ImageIcon, Send, Trash2 } from 'lucide-react';
import ChannelPostBubble from '@/components/ChannelPostBubble';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCommunityData = async () => {
    try {
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
        setCurrentUsername(profile.username || session.user.user_metadata?.full_name || 'مستخدم');
        setCurrentUserAvatar(profile.avatar_url || '');
      }

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

      const { data: member } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();

      setIsMember(!!member);

      const { data: postsData } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_user_id_fkey(username, avatar_url)')
        .eq('community_id', id)
        .order('created_at', { ascending: true }); // Ascending for chat UI (oldest at top, newest at bottom)

      if (postsData) {
        setPosts(postsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();

    let channel: any;
    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      channel = supabase.channel(`community_posts_${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `community_id=eq.${id}` }, payload => {
          if (payload.eventType === 'INSERT') {
            fetchCommunityData();
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            fetchCommunityData();
          }
        })
        .subscribe();
    };
    setupRealtime();

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [id]);

  const toggleMembership = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (isMember) {
        await supabase.from('community_members').delete().eq('community_id', id).eq('user_id', currentUserId);
        await supabase.from('communities').update({ members_count: Math.max(0, (community.members_count || 1) - 1) }).eq('id', id);
        setIsMember(false);
        setCommunity((prev: any) => ({ ...prev, members_count: Math.max(0, (prev.members_count || 1) - 1) }));
      } else {
        await supabase.from('community_members').insert({ community_id: id, user_id: currentUserId, role: 'member' });
        await supabase.from('communities').update({ members_count: (community.members_count || 0) + 1 }).eq('id', id);
        setIsMember(true);
        setCommunity((prev: any) => ({ ...prev, members_count: (prev.members_count || 0) + 1 }));
      }
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    }
  };

  const handleDeleteCommunity = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      await supabase.from('communities').delete().eq('id', community.id);
      router.push('/home');
    } catch (e) {
      console.error(e);
      alert('فشل الحذف');
    }
  };

  const handlePostSubmit = async () => {
    if (!newPost.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.from('posts').insert({
        content: newPost.trim(),
        user_id: currentUserId,
        community_id: id,
        is_comments_disabled: true
      });
      if (!error) {
        setNewPost('');
        // Realtime will update UI, but scroll to bottom usually handled here
        window.scrollTo(0, document.body.scrollHeight);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex justify-center bg-[#0b141a] font-sans text-right">
        <div className="w-8 h-8 mt-20 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0b141a] text-white font-sans text-right">
        <h2 className="text-xl font-bold mb-4">هذه القناة غير موجودة</h2>
        <button onClick={() => router.push('/home')} className="px-6 py-2 bg-[#00a884] rounded-full font-bold">عودة للرئيسية</button>
      </div>
    );
  }

  const isCreator = currentUserId === community.creator_id;

  return (
    <div className="w-full flex flex-col relative h-[100dvh] bg-[#0b141a] font-sans text-right">
      {/* WhatsApp Style Header */}
      <header className="sticky top-0 z-50 bg-[#202c33]/85 backdrop-blur-md flex items-center px-4 py-3 gap-4 shadow-lg border-b border-[#2a3942]">
        <button onClick={() => router.push('/home')} className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowRight className="text-slate-300" size={24} />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {community.avatar_url ? (
            <img src={community.avatar_url} alt={community.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-300">
              {community.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 cursor-pointer">
          <h2 className="text-[16px] font-semibold text-white leading-tight">{community.name}</h2>
          <p className="text-[13px] text-slate-400">{community.members_count || 0} متابع</p>
        </div>

        {isCreator && (
          <button 
            onClick={handleDeleteCommunity}
            className="p-2 text-red-400 hover:bg-white/10 rounded-full transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-2 pt-6 pb-24 bg-[#0b141a] bg-opacity-95" style={{ backgroundImage: "url('https://i.pinimg.com/1200x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')", backgroundBlendMode: 'overlay', backgroundSize: 'cover' }}>
        
        {/* Channel Info Card inside chat */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#182229] border border-[#2a3942] rounded-xl p-4 text-center max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">قناة {community.name}</h3>
            <p className="text-slate-400 text-sm">{community.description || 'لا يوجد وصف لهذه القناة'}</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center mt-10">
            <span className="bg-[#182229] text-slate-300 text-xs px-4 py-1.5 rounded-lg shadow-sm">
              أنت تتابع هذه القناة الآن
            </span>
          </div>
        ) : (
          posts.map((post) => (
            <ChannelPostBubble 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onPostDeleted={handlePostDeleted}
            />
          ))
        )}
        
        <div className="h-20" /> {/* Spacer */}
      </main>

      {/* Footer Area */}
      <div className="absolute bottom-0 left-0 w-full z-40 bg-[#182229] border-t border-[#2a3942] p-3 sm:p-4">
        {isCreator ? (
          <div className="flex gap-2 items-end max-w-3xl mx-auto w-full">
            <div className="flex-1 bg-[#202c33] rounded-3xl flex items-center px-4 py-2 min-h-[50px]">
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="رسالة البث..."
                className="w-full bg-transparent text-white outline-none resize-none max-h-32 text-[15px]"
                rows={1}
                dir="auto"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostSubmit();
                  }
                }}
              />
            </div>
            <button 
              onClick={handlePostSubmit}
              disabled={!newPost.trim() || isSubmitting}
              className="w-[50px] h-[50px] rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 disabled:opacity-50 transition-opacity"
            >
              <Send size={20} className="-ml-1" />
            </button>
          </div>
        ) : !isMember ? (
          <div className="max-w-3xl mx-auto w-full">
            <button 
              onClick={toggleMembership}
              className="w-full bg-[#00a884] hover:bg-[#029576] text-[#111b21] py-3.5 rounded-full font-bold text-[16px] shadow-lg transition-colors"
            >
              متابعة القناة
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            <div className="w-full py-3 text-center text-slate-400 text-sm">
              أنت تتابع هذه القناة
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
