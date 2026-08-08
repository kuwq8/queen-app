'use client';


// Imports updated
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Users, Plus, Search, Check } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function MessagesPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [chatMode, setChatMode] = useState<'private' | 'group'>('private');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/');
      setCurrentUserId(session.user.id);
      fetchRooms();
    };
    init();
  }, []);

  useEffect(() => {
    if (isNewChatOpen) {
      handleSearch(''); // Fetch default contacts
    }
  }, [isNewChatOpen]);

  const fetchRooms = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/');

      const { data: myMemberships } = await supabase
        .from('channel_members')
        .select('channel_id')
        .eq('user_id', session.user.id);

      if (!myMemberships || myMemberships.length === 0) {
        setRooms([]);
        return;
      }

      const channelIds = myMemberships.map(m => m.channel_id);

      const { data: channels, error } = await supabase
        .from('channels')
        .select(`
          id,
          name,
          is_group,
          created_at,
          participants:channel_members(*),
          messages(
            id,
            content,
            media_url,
            created_at,
            sender_id
          )
        `)
        .in('id', channelIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      if (channels) {
        // Collect all user IDs to fetch profiles
        const userIds = new Set<string>();
        channels.forEach((ch: any) => {
          ch.participants?.forEach((p: any) => userIds.add(p.user_id));
          ch.messages?.forEach((m: any) => userIds.add(m.sender_id));
        });

        let profilesMap: Record<string, any> = {};
        if (userIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', Array.from(userIds));
          
          if (profilesData) {
            profilesData.forEach(p => { profilesMap[p.id] = p; });
          }
        }

        // Reconstruct nested structure manually
        const processedChannels = channels.map((ch: any) => {
          const participants = ch.participants?.map((p: any) => ({
            ...p,
            user: profilesMap[p.user_id] || null
          }));
          const messages = ch.messages?.map((m: any) => ({
            ...m,
            sender: profilesMap[m.sender_id] || null
          }));
          
          return {
            ...ch,
            participants,
            messages
          };
        });

        // Map to match component expectations
        const formattedRooms = processedChannels.map((c: any) => ({
          ...c,
          isGroup: c.is_group,
          // Limit to 1 message just for preview
          messages: c.messages && c.messages.length > 0 ? [c.messages[0]] : []
        }));
        
        // Sort rooms by last message date
        formattedRooms.sort((a, b) => {
          const aTime = a.messages[0] ? new Date(a.messages[0].created_at).getTime() : new Date(a.created_at).getTime();
          const bTime = b.messages[0] ? new Date(b.messages[0].created_at).getTime() : new Date(b.created_at).getTime();
          return bTime - aTime;
        });
        
        setRooms(formattedRooms);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let query = supabase.from('profiles').select('*');
      if (q) {
        query = query.ilike('username', `%${q}%`);
      }
      query = query.neq('id', session.user.id).limit(20);
      
      const { data } = await query;
      if (data) {
        setSearchResults(data.map(p => ({
          id: p.id,
          username: p.username,
          profile: { avatarUrl: p.avatar_url }
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startChat = async (userToChatWith?: any) => {
    let users = [];
    let isGroup = false;
    let name = null;

    if (chatMode === 'private') {
      if (!userToChatWith) return;
      users = [userToChatWith];
    } else {
      if (selectedUsers.length === 0) return alert('يرجى تحديد مستخدم واحد على الأقل');
      if (!groupName.trim()) return alert('يرجى كتابة اسم للمجموعة');
      users = selectedUsers;
      isGroup = true;
      name = groupName.trim();
    }

    setIsCreating(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      let channelIdToNavigate = null;

      if (chatMode === 'private') {
        const { data: existingChat, error: rpcError } = await supabase.rpc('get_or_create_private_chat', { other_user_id: users[0].id });
        if (existingChat) {
          channelIdToNavigate = existingChat;
        } else {
          // Fallback if RPC fails or isn't installed
          const { data: channel, error: channelError } = await supabase.from('channels').insert({ is_group: false, name: '' }).select().single();
          if (channelError) throw channelError;
          
          // Deduplicate members (in case user selected themselves, though search filters it out, just to be safe)
          const memberIds = Array.from(new Set([session.user.id, users[0].id]));
          const members = memberIds.map(id => ({ channel_id: channel.id, user_id: id }));
          
          const { error: membersError } = await supabase.from('channel_members').insert(members);
          if (membersError) throw membersError;
          
          channelIdToNavigate = channel.id;
        }
      } else {
        // 1. Create group channel
        const { data: channel, error: channelError } = await supabase
          .from('channels')
          .insert({ is_group: true, name })
          .select()
          .single();

        if (channelError) throw channelError;

        // 2. Add members, ensuring no duplicates
        const memberIds = Array.from(new Set([session.user.id, ...users.map(u => u.id)]));
        const members = memberIds.map(id => ({ channel_id: channel.id, user_id: id }));

        const { error: membersError } = await supabase
          .from('channel_members')
          .insert(members);

        if (membersError) throw membersError;
        
        channelIdToNavigate = channel.id;
      }

      setIsNewChatOpen(false);
      setSelectedUsers([]);
      setGroupName('');
      setSearchQuery('');
      setSearchResults([]);
      router.push(`/messages/${channelIdToNavigate}`);
    } catch (e: any) {
      console.error(e);
      alert('حدث خطأ: ' + JSON.stringify(e));
    } finally {
      setIsCreating(false);
    }
  };

  const closeNewChat = () => {
    setIsNewChatOpen(false);
    setSelectedUsers([]);
    setGroupName('');
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="min-h-screen flex justify-center bg-black font-sans text-right">
      <div className="w-full max-w-[600px] flex flex-col relative pb-[60px] border-x border-slate-800 min-h-screen bg-black">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">الرسائل</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => { setChatMode('private'); setIsNewChatOpen(true); }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1"
              title="دردشة خاصة جديدة"
            >
              <Plus size={20} />
            </button>
            <button 
              onClick={() => { setChatMode('group'); setIsNewChatOpen(true); }}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1 text-cyan-500 bg-cyan-900/20"
              title="مجموعة جديدة"
            >
              <Users size={18} />
              <span className="text-sm font-bold ml-1">مجموعة</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="divide-y divide-slate-800 flex-1 flex flex-col">
          {rooms.map(room => {
            const otherParticipants = room.participants.filter((p: any) => p.user?.id !== currentUserId);
            const isGroup = room.isGroup;
            const title = isGroup ? room.name : (otherParticipants[0]?.user?.username || 'مجهول');
            const avatar = isGroup ? null : otherParticipants[0]?.user?.avatar_url;
            const lastMsg = room.messages && room.messages.length > 0 ? room.messages[0] : null;

            return (
              <div 
                key={room.id}
                onClick={() => router.push(`/messages/${room.id}`)}
                className="p-4 flex items-center gap-4 hover:bg-slate-900 cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatar ? (
                    <img src={avatar} className="w-full h-full object-cover" />
                  ) : isGroup ? (
                    <Users size={20} className="text-slate-400" />
                  ) : (
                    <span className="font-bold text-lg" dir="ltr">{title.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-white truncate" dir="ltr">{title}</h3>
                    {lastMsg && (
                      <span className="text-xs text-slate-500">
                        {new Date(lastMsg.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <p className="text-slate-400 text-sm truncate">
                      {lastMsg.sender?.id === currentUserId ? 'أنت: ' : <span dir="ltr">{`${lastMsg.sender?.username}: `}</span>}
                      {lastMsg.content || (lastMsg.media_url ? (lastMsg.media_url.endsWith('.webm') ? '🎤 رسالة صوتية' : '📎 وسائط') : '')}
                    </p>
                  ) : (
                    <p className="text-slate-500 text-sm italic">محادثة جديدة</p>
                  )}
                </div>
              </div>
            );
          })}
          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 text-center h-[calc(100vh-180px)]">
              <MessageSquare size={64} className="mb-6 text-slate-700" strokeWidth={1} />
              <h2 className="text-2xl sm:text-[32px] font-extrabold text-white mb-3 leading-snug">أهلاً بك في صندوق الرسائل!</h2>
              <p className="text-slate-500 text-sm sm:text-[15px] mb-8 max-w-[300px]">تواصل وشارك المنشورات والمزيد عبر المحادثات الخاصة.</p>
              <button 
                onClick={() => { setChatMode('private'); setIsNewChatOpen(true); }}
                className="bg-white hover:bg-slate-200 text-black font-bold py-3.5 px-8 rounded-full transition-colors text-[16px] shadow-lg shadow-white/5"
              >
                اكتب رسالة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex justify-center items-start pt-16 sm:pt-24 px-4 text-right">
          <div className="bg-[#111] w-full max-w-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <button onClick={closeNewChat} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">✕</button>
              <h3 className="text-lg font-bold">
                {chatMode === 'group' ? 'إنشاء مجموعة جديدة' : 'رسالة جديدة'}
              </h3>
            </div>
            
            {chatMode === 'group' && (
              <p className="text-xs text-slate-400 mb-4 px-2">
                اختر المستخدمين واكتب اسم المجموعة بالأسفل.
              </p>
            )}

            <div className="bg-slate-900 rounded-xl p-3 flex items-center gap-3 mb-4 border border-slate-700 focus-within:border-cyan-500 transition-colors">
              <Search size={18} className="text-slate-500" />
              <input 
                type="text" 
                placeholder="البحث في جهات الاتصال..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-white focus:outline-none flex-1"
              />
            </div>

            {chatMode === 'group' && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                {selectedUsers.map(u => (
                  <div key={u.id} className="bg-cyan-600/20 border border-cyan-600/50 text-cyan-400 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <button onClick={() => setSelectedUsers(selectedUsers.filter(user => user.id !== u.id))} className="hover:text-white">✕</button>
                    <span className="font-bold" dir="ltr">{u.username}</span>
                  </div>
                ))}
              </div>
            )}

            {chatMode === 'group' && (
              <input
                type="text"
                placeholder="اسم المجموعة (مطلوب)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-slate-900 p-3 rounded-xl focus:outline-none border border-slate-800 focus:border-cyan-500 mb-4 transition-colors text-right"
              />
            )}

            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {searchResults.length === 0 && (
                <div className="text-center text-slate-500 py-8 text-sm font-bold">
                  {searchQuery ? 'لا يوجد مستخدمين.' : 'ليس لديك جهات اتصال. تابع أشخاصاً لتتمكن من مراسلتهم!'}
                </div>
              )}
              {searchResults.map(user => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                return (
                  <div 
                    key={user.id} 
                    onClick={() => {
                      if (chatMode === 'private') {
                        startChat(user); // Start chat immediately for private
                      } else {
                        // Toggle selection for group
                        if (isSelected) {
                          setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                        } else {
                          setSelectedUsers([...selectedUsers, user]);
                        }
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-slate-800`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {user.profile?.avatarUrl ? (
                        <img src={user.profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-lg" dir="ltr">{user.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg" dir="ltr">{user.username}</div>
                      <div className="text-slate-500 text-sm" dir="ltr">@{user.username}</div>
                    </div>
                    {chatMode === 'group' && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                        {isSelected && <Check size={16} strokeWidth={4} className="text-black" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {chatMode === 'group' && (
              <button 
                onClick={() => startChat()}
                disabled={selectedUsers.length === 0 || !groupName.trim() || isCreating}
                className="w-full py-3 bg-white text-black font-bold rounded-full disabled:opacity-50 hover:bg-slate-200 transition-colors"
              >
                {isCreating ? 'جاري الإنشاء...' : 'إنشاء المجموعة'}
              </button>
            )}
          </div>
        </div>
      )}

      <BottomNav activeTab="messages" />
    </div>
  );
}
