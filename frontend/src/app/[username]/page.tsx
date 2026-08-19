'use client';


import { API_URL } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Repeat, Heart, Share, Calendar, MapPin, Link as LinkIcon, User, Camera, Mail, Phone, Video, Lock } from 'lucide-react';
import { useRef } from 'react';
import PostItem from '../../components/PostItem';
import BottomNav from '../../components/BottomNav';
import FollowButton from '../../components/FollowButton';
import { createClient } from '@/utils/supabase/client';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  let username = decodeURIComponent(params.username as string);
  if (username.startsWith('@')) {
    username = username.substring(1);
  }

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [allowDMs, setAllowDMs] = useState(true);
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [debugMsg, setDebugMsg] = useState('Init');
  const [bookmarkedPosts, setBookmarkedPosts] = useState<any[]>([]);

  const fetchBookmarksList = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('bookmarks')
        .select(`
          post:posts (
            *,
            author:profiles!user_id(username, avatar_url)
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        const posts = data.map(b => b.post);
        setBookmarkedPosts(posts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (currentUserProfile) {
        setCurrentUsername(currentUserProfile.username);
      }
      
      fetchProfile();
      fetchPosts();
    };
    
    init();
  }, [username, router]);

  const fetchProfile = async () => {
    try {
      setDebugMsg('Step 1: start');
      
      setDebugMsg('Step 2: fetching profile data');
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error || !targetProfile) {
        setDebugMsg(`Step 2 Error: ${JSON.stringify(error)}`);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setDebugMsg('Step 3: setting initial profile');
      // Set the profile IMMEDIATELY so the UI renders!
      setProfile({
        ...targetProfile,
        profile: {
          bio: targetProfile.bio || '',
          avatarUrl: targetProfile.avatar_url,
          coverUrl: targetProfile.cover_url,
          allowDirectMessages: true
        },
        _count: { followers: 0, following: 0, posts: 0 },
        isFollowing: false,
        createdAt: targetProfile.created_at
      });
      setEditBio(targetProfile.bio || '');
      setEditFirstName(targetProfile.first_name || '');
      setEditLastName(targetProfile.last_name || '');
      setIsLoading(false);

      try {
        setDebugMsg('Step 4: fetching counts & session');
        const [followersRes, followingRes, postsRes, sessionRes] = await Promise.all([
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetProfile.id),
          supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetProfile.id),
          supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', targetProfile.id),
          supabase.auth.getSession()
        ]);

        let isFollowing = false;
        let followStatus = 'none';
        if (sessionRes.data.session) {
          const { data: followData } = await supabase.from('follows').select('*').eq('follower_id', sessionRes.data.session.user.id).eq('following_id', targetProfile.id).maybeSingle();
          if (followData) {
            isFollowing = followData.status === 'accepted';
            followStatus = followData.status;
          }
        }

        setProfile((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            _count: {
              followers: followersRes.count || 0,
              following: followingRes.count || 0,
              posts: postsRes.count || 0
            },
            isFollowing,
            followStatus,
            is_private: targetProfile.is_private,
            allow_messages: targetProfile.allow_messages,
            allow_calls: targetProfile.allow_calls
          };
        });
        setDebugMsg('Step 7: done');
      } catch (e) {
        console.error("Error fetching extra profile data:", e);
      }
    } catch (err) {
      setDebugMsg(`Catch Error: ${String(err)}`);
      // Don't set profile to null here if we already fetched it successfully
    }
  };

  const fetchPosts = async () => {
    try {
      
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, is_private')
        .eq('username', username)
        .single();
        
      if (!targetProfile) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      const isOwner = session?.user?.id === targetProfile.id;
      
      // If private and not owner and we don't have accepted follow, don't even try to fetch
      // because RLS will block it anyway, but we can save a network request
      if (targetProfile.is_private && !isOwner) {
        if (!session) {
           setPosts([]);
           setIsLoading(false);
           return;
        }
        const { data: followData } = await supabase.from('follows').select('status').eq('follower_id', session.user.id).eq('following_id', targetProfile.id).maybeSingle();
        if (!followData || followData.status !== 'accepted') {
           setPosts([]);
           setIsLoading(false);
           return;
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!user_id(username, avatar_url)
        `)
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();
        
      if (!targetProfile) return;

      if (profile.followStatus === 'accepted' || profile.followStatus === 'pending') {
        await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', targetProfile.id);
        setProfile((prev: any) => ({
          ...prev,
          isFollowing: false,
          followStatus: 'none',
          _count: { ...prev._count, followers: prev.followStatus === 'accepted' ? prev._count.followers - 1 : prev._count.followers }
        }));
      } else {
        const { data, error } = await supabase.from('follows').insert({ follower_id: session.user.id, following_id: targetProfile.id }).select().single();
        if (!error && data) {
          setProfile((prev: any) => ({
            ...prev,
            isFollowing: data.status === 'accepted',
            followStatus: data.status,
            _count: { ...prev._count, followers: data.status === 'accepted' ? prev._count.followers + 1 : prev._count.followers }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setProfile((prev: any) => ({
      ...prev,
      _count: { ...prev._count, posts: prev._count.posts - 1 }
    }));
  };

  const handlePostEdited = (postId: string, newContent: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, content: newContent } : p));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ bio: editBio, first_name: editFirstName, last_name: editLastName })
        .eq('id', session.user.id);
        
      if (!error) {
        setProfile((prev: any) => ({
          ...prev,
          first_name: editFirstName,
          last_name: editLastName,
          profile: { ...prev.profile, bio: editBio }
        }));
        setIsEditProfileOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCall = async (type: 'audio' | 'video') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      if (!profile) return;

      const { data: myProfile } = await supabase.from('profiles').select('username, avatar_url').eq('id', session.user.id).single();

      const { data: call } = await supabase.from('calls').insert({
        caller_id: session.user.id,
        receiver_id: profile.id,
        call_type: type,
        status: 'ringing'
      }).select().single();

      if (call) {
        router.push(`/call/${call.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('فشل بدء المكالمة');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const bucket = type === 'avatar' ? 'avatars' : 'covers';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // Update Profile DB
      const updateData = type === 'avatar' ? { avatar_url: publicUrl } : { cover_url: publicUrl };
      const { error: dbError } = await supabase.from('profiles').update(updateData).eq('id', session.user.id);
      
      if (dbError) throw dbError;

      // Update Local State
      setProfile((prev: any) => ({
        ...prev,
        profile: { ...prev.profile, [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: publicUrl }
      }));

    } catch (e: any) {
      console.error(e);
      alert('فشل رفع الصورة: ' + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDMs = async () => {
    const newValue = !allowDMs;
    setAllowDMs(newValue);
    // You would update a privacy table here if you had one.
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center bg-black font-sans text-right">
        <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black">
          {/* Skeleton Header */}
          <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 py-2 gap-6 border-b border-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-slate-800 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-5 bg-slate-800 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-slate-800 rounded animate-pulse"></div>
            </div>
          </header>

          {/* Skeleton Cover & Avatar */}
          <div className="relative">
            <div className="h-32 sm:h-48 bg-slate-900 animate-pulse"></div>
            <div className="px-4 pb-4">
              <div className="flex justify-between items-start">
                <div className="-mt-12 sm:-mt-16 relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-800 border-4 border-black animate-pulse"></div>
                </div>
                <div className="mt-14 sm:mt-20">
                  <div className="w-24 h-8 rounded-full bg-slate-800 animate-pulse"></div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col gap-3">
                <div className="w-32 h-6 bg-slate-800 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-slate-800 rounded animate-pulse"></div>
                <div className="w-full h-16 bg-slate-800 rounded animate-pulse mt-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-bold mb-4">الحساب غير موجود</h1>
        <p className="text-gray-400 mb-6 font-mono border border-gray-700 p-2 rounded text-center">
          @{username}<br/>
          Debug: {debugMsg}
        </p>
        <button onClick={() => router.back()} className="text-cyan-500 hover:underline">العودة</button>
      </div>
    );
  }

  const isOwnProfile = currentUsername === username;

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md flex items-center px-4 py-2 gap-6 border-b border-slate-800/50">
          <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowRight className="text-white" size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight" dir="ltr">{profile.username}</h2>
            <p className="text-xs text-slate-500">{profile._count?.posts || 0} منشورات</p>
          </div>
        </header>

        {/* Profile Info Section */}
        <div className="relative">
          <div className="h-32 sm:h-48 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 relative">
            {profile.profile?.coverUrl && (
              <img src={profile.profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="px-4 pb-4">
            <div className="flex justify-between items-start">
              <div className="-mt-12 sm:-mt-16 relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-black border-4 border-black flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center font-bold text-4xl text-slate-300">
                    {profile.profile?.avatarUrl ? (
                      <img src={profile.profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
                    ) : (
                      <span dir="ltr">{profile.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-14 sm:mt-20">
                {isOwnProfile ? (
                  <button 
                    onClick={() => setIsEditProfileOpen(true)}
                    className="px-4 py-1.5 rounded-full border border-slate-600 text-white font-bold text-[15px] hover:bg-slate-800 transition-colors"
                  >
                    تعديل الحساب
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    {/* Message Button logic */}
                    {(!profile.allow_messages || profile.allow_messages === 'everyone' || (profile.allow_messages === 'followers' && profile.isFollowing)) && (
                      <button 
                        onClick={async () => {
                          try {
                            const { createClient } = await import('@/utils/supabase/client');
                            const supabase = createClient();
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) return;
                            
                            const { data: existingParticipant } = await supabase
                              .from('conversation_participants')
                              .select('conversation_id')
                              .eq('user_id', session.user.id)
                              .in('conversation_id', (
                                await supabase
                                  .from('conversation_participants')
                                  .select('conversation_id')
                                  .eq('user_id', profile.id)
                              ).data?.map(p => p.conversation_id) || [])
                              .maybeSingle();

                            if (existingParticipant) {
                              router.push(`/messages/${existingParticipant.conversation_id}`);
                            } else {
                              const { data: newConv, error: convError } = await supabase
                                .from('conversations')
                                .insert({})
                                .select()
                                .single();

                              if (convError || !newConv) {
                                alert('فشل إنشاء المحادثة: ' + JSON.stringify(convError));
                                return;
                              }

                              const { error: membersError } = await supabase
                                .from('conversation_participants')
                                .insert([
                                  { conversation_id: newConv.id, user_id: session.user.id },
                                  { conversation_id: newConv.id, user_id: profile.id }
                                ]);

                              if (membersError) {
                                alert('فشل إضافة الأعضاء (قد يكون بسبب الخصوصية): ' + JSON.stringify(membersError));
                                return;
                              }

                              router.push(`/messages/${newConv.id}`);
                            }
                          } catch (err: any) {
                            alert('حدث خطأ غير متوقع: ' + err.message);
                          }
                        }}
                        className="w-9 h-9 rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
                        title="مراسلة"
                      >
                        <Mail size={18} />
                      </button>
                    )}

                    {/* Call Buttons logic */}
                    {(!profile.allow_calls || profile.allow_calls === 'everyone' || (profile.allow_calls === 'followers' && profile.isFollowing)) && (
                      <>
                        <button 
                          onClick={() => handleCall('audio')}
                          className="w-9 h-9 rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
                          title="اتصال صوتي"
                        >
                          <Phone size={18} />
                        </button>
                        <button 
                          onClick={() => handleCall('video')}
                          className="w-9 h-9 rounded-full border border-slate-600 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
                          title="اتصال فيديو"
                        >
                          <Video size={18} />
                        </button>
                      </>
                    )}
                    <FollowButton 
                      targetUserId={profile.id}
                      initialIsFollowing={profile.isFollowing}
                      initialFollowStatus={profile.followStatus}
                      onToggle={(isFollowing, status) => {
                        setProfile((prev: any) => ({
                          ...prev,
                          isFollowing,
                          followStatus: status,
                          _count: { ...prev._count, followers: Math.max(0, prev._count.followers + (isFollowing ? 1 : -1)) }
                        }));
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white" dir="ltr">{profile.username}</h1>
              <p className="text-[15px] text-slate-500 mb-3" dir="ltr">@{profile.username}</p>
              
              <div className="text-[15px] text-white leading-relaxed mb-3">
                {profile.profile?.bio || 'لم يقم هذا المستخدم بكتابة نبذة بعد.'}
              </div>

              <div className="flex flex-wrap items-center text-slate-500 text-[15px] mb-3 gap-y-2">
                <div className="flex items-center ml-4">
                  <Calendar size={16} className="ml-1.5" />
                  <span>انضم في {new Date(profile.createdAt).toLocaleDateString('ar-SA', {month: 'long', year: 'numeric'})}</span>
                </div>
              </div>

              <div className="flex items-center gap-5 text-[15px]">
                <div className="flex gap-1 hover:underline cursor-pointer">
                  <span className="font-bold text-white">{profile._count?.following || 0}</span>
                  <span className="text-slate-500">متابَعون</span>
                </div>
                <div className="flex gap-1 hover:underline cursor-pointer">
                  <span className="font-bold text-white">{profile._count?.followers || 0}</span>
                  <span className="text-slate-500">متابعون</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-4 mt-6">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'posts' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            المنشورات
          </button>
          <button 
            onClick={() => setActiveTab('likes')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'likes' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            الإعجابات
          </button>
          {isOwnProfile && (
            <button 
              onClick={() => { setActiveTab('bookmarks'); fetchBookmarksList(); }}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'bookmarks' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              السجل
            </button>
          )}
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-cyan-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              الإعدادات
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {profile.is_private && !isOwnProfile && profile.followStatus !== 'accepted' ? (
            <div className="py-20 px-8 text-center flex flex-col items-center justify-center border border-slate-800 rounded-2xl bg-[#0a0a0a] mt-4 shadow-lg shadow-black/50">
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                <Lock size={32} className="text-slate-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">هذا الحساب خاص</h3>
              <p className="text-slate-400 text-[15px] max-w-sm mb-6 leading-relaxed">
                منشورات وصور @{profile.username} تظهر فقط للمتابعين المقبولين. أرسل طلب متابعة لرؤية المحتوى.
              </p>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="pb-[60px]">
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
                    <div className="text-center p-12 text-slate-500 font-bold">
                      لم يقم بنشر أي شيء بعد.
                    </div>
                  )}
                </div>
              )}
          {activeTab === 'likes' && (
            <div className="text-center text-slate-500 py-10 font-bold">
              ستظهر المنشورات المعجب بها هنا قريباً.
            </div>
          )}
          {activeTab === 'bookmarks' && isOwnProfile && (
            <div className="pb-[60px]">
              {bookmarkedPosts.length > 0 ? (
                bookmarkedPosts.map((post) => (
                  <PostItem 
                    key={post.id} 
                    post={post} 
                    currentUsername={currentUsername} 
                    onPostDeleted={() => {}}
                    onPostEdited={() => {}}
                  />
                ))
              ) : (
                <div className="text-center text-slate-500 py-10 font-bold">
                  لم تقم بحفظ أي منشورات بعد.
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings' && isOwnProfile && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="font-bold text-xl mb-4">إعدادات الخصوصية</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">السماح بالرسائل الخاصة</h4>
                  <p className="text-sm text-slate-400">استقبال رسائل خاصة من المستخدمين الآخرين.</p>
                </div>
                <button 
                  onClick={toggleDMs}
                  className={`w-12 h-6 rounded-full transition-colors relative ${allowDMs ? 'bg-cyan-500' : 'bg-slate-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${allowDMs ? '-translate-x-6' : '-translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center px-4">
            <div className="bg-[#111] w-full max-w-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                    <span className="text-xl font-bold px-1">✕</span>
                  </button>
                  <h2 className="text-lg font-bold text-white">تعديل الحساب</h2>
                </div>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-white hover:bg-slate-200 text-black font-bold px-5 py-1.5 text-sm rounded-full disabled:opacity-50 transition-colors"
                >
                  {isSavingProfile ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
              <div className="space-y-4">
                {/* Image Edit Controls */}
                <div className="flex gap-4 mb-4">
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                  
                  <button 
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm text-slate-300 transition-colors disabled:opacity-50 font-bold"
                  >
                    <Camera size={16} /> <span>تغيير الصورة</span>
                  </button>
                  <button 
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 py-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm text-slate-300 transition-colors disabled:opacity-50 font-bold"
                  >
                    <Camera size={16} /> <span>تغيير الغلاف</span>
                  </button>
                </div>

                <div className="flex gap-3">
                  <div className="relative border border-slate-700 rounded-md px-3 pt-6 pb-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all text-right flex-1">
                    <label className="absolute top-2 right-3 text-xs text-slate-500 font-bold">الاسم الأول</label>
                    <input 
                      type="text"
                      className="w-full bg-transparent text-white focus:outline-none text-[15px]"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div className="relative border border-slate-700 rounded-md px-3 pt-6 pb-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all text-right flex-1">
                    <label className="absolute top-2 right-3 text-xs text-slate-500 font-bold">اسم العائلة</label>
                    <input 
                      type="text"
                      className="w-full bg-transparent text-white focus:outline-none text-[15px]"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="relative border border-slate-700 rounded-md px-3 pt-6 pb-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all text-right">
                  <label className="absolute top-2 right-3 text-xs text-slate-500 font-bold">النبذة (Bio)</label>
                  <textarea 
                    className="w-full bg-transparent text-white focus:outline-none resize-none text-[15px]"
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={160}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <BottomNav activeTab={'' as any} />
      </div>
    </div>
  );
}
