'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, User, Plus, Search, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function MessagesSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeChatId = params?.id as string;
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  
  // New Chat Modal State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      setCurrentUserId(session.user.id);

      // Fetch conversations where the user is a participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          last_read_at,
          conversations (
            updated_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('conversations(updated_at)', { ascending: false });

      if (participants && participants.length > 0) {
        const convIds = participants.map(p => p.conversation_id);
        
        // For each conversation, fetch the *other* participant's profile
        // and the latest message
        const convos = await Promise.all(participants.map(async (p) => {
           const { data: otherUser } = await supabase
             .from('conversation_participants')
             .select('profiles(id, username, avatar_url, first_name, last_name)')
             .eq('conversation_id', p.conversation_id)
             .neq('user_id', session.user.id)
             .single();
             
           const { data: latestMsg } = await supabase
             .from('messages')
             .select('content, created_at, sender_id, is_read')
             .eq('conversation_id', p.conversation_id)
             .order('created_at', { ascending: false })
             .limit(1)
             .single();

           let unreadCount = 0;
           if (p.last_read_at) {
             const { count } = await supabase
               .from('messages')
               .select('*', { count: 'exact', head: true })
               .eq('conversation_id', p.conversation_id)
               .neq('sender_id', session.user.id)
               .gt('created_at', p.last_read_at);
             unreadCount = count || 0;
           } else {
             // If no last_read_at, all messages from other are unread
             const { count } = await supabase
               .from('messages')
               .select('*', { count: 'exact', head: true })
               .eq('conversation_id', p.conversation_id)
               .neq('sender_id', session.user.id);
             unreadCount = count || 0;
           }

           return {
             id: p.conversation_id,
             otherUser: otherUser?.profiles,
             latestMessage: latestMsg,
             updatedAt: (((p as any).conversations?.[0]?.updated_at || (p as any).conversations?.updated_at)) || (latestMsg ? latestMsg.created_at : 0),
             unreadCount
           };
        }));
        
        convos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setConversations(convos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return;
    
    const supabase = createClient();
    
    // Listen to new messages to update the sidebar
    const channel = supabase.channel('sidebar_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, async (payload) => {
        const newMessage = payload.new;
        
        // Check if this message belongs to one of our conversations
        setConversations(prevConvos => {
          const convIndex = prevConvos.findIndex(c => c.id === newMessage.conversation_id);
          if (convIndex === -1) {
            // New conversation created, refetch all to simplify
            fetchConversations();
            return prevConvos;
          }
          
          const newConvos = [...prevConvos];
          const updatedConv = { ...newConvos[convIndex] };
          updatedConv.latestMessage = newMessage;
          updatedConv.updatedAt = newMessage.created_at;
          
          // If we are not currently viewing this chat and we didn't send it, increment unread
          if (newMessage.sender_id !== currentUserId && activeChatId !== newMessage.conversation_id) {
            updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
          }
          
          newConvos.splice(convIndex, 1);
          newConvos.unshift(updatedConv); // Move to top
          
          return newConvos;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeChatId]);


  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, avatar_url')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(10);
      
    setSearchResults(data || []);
    setIsSearching(false);
  };

  const handleStartChat = async (targetUserId: string) => {
    const supabase = createClient();
    // Check if conversation already exists
    const { data: existingParticipant } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', currentUserId)
      .in('conversation_id', (
        await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', targetUserId)
      ).data?.map(p => p.conversation_id) || [])
      .maybeSingle();

    let convId;
    if (existingParticipant) {
      convId = existingParticipant.conversation_id;
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
        
      if (newConv) {
        convId = newConv.id;
        await supabase.from('conversation_participants').insert([
          { conversation_id: convId, user_id: currentUserId },
          { conversation_id: convId, user_id: targetUserId }
        ]);
      }
    }

    if (convId) {
      setIsNewChatOpen(false);
      router.push(`/messages/${convId}`);
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">الرسائل</h2>
        <button 
          onClick={() => setIsNewChatOpen(true)} 
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white"
          title="رسالة جديدة"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري التحميل...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-8 text-slate-500 flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-slate-700" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">مرحباً بك في الرسائل</h3>
            <p className="text-sm">ابدأ محادثة جديدة للتواصل مع الآخرين.</p>
            <button 
              onClick={() => setIsNewChatOpen(true)} 
              className="mt-6 bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-slate-200 transition-colors"
            >
              رسالة جديدة
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((conv) => {
              if (!conv.otherUser) return null;
              
              const isUnread = conv.unreadCount > 0;
              const isActive = activeChatId === conv.id;

              return (
                <Link href={`/messages/${conv.id}`} key={conv.id} className="block group">
                  <div className={`flex items-center gap-3 p-3 transition-all cursor-pointer ${isActive ? 'bg-slate-900 border-r-4 border-cyan-500' : 'hover:bg-slate-900/50'}`}>
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                      {conv.otherUser?.avatar_url ? (
                        <img src={conv.otherUser?.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[15px] truncate ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                          {conv.otherUser?.first_name ? `${conv.otherUser?.first_name} ${conv.otherUser?.last_name||''}` : conv.otherUser?.username}
                        </span>
                        {conv.latestMessage && (
                          <span className={`text-[12px] shrink-0 ${isUnread ? 'text-cyan-500 font-bold' : 'text-slate-500'}`}>
                            {new Date(conv.latestMessage.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[14px] truncate ${isUnread ? 'text-white font-bold' : 'text-slate-400'}`}>
                          {conv.latestMessage ? conv.latestMessage.content : 'لا توجد رسائل بعد'}
                        </p>
                        {isUnread && (
                          <div className="min-w-[20px] h-5 px-1.5 bg-cyan-500 text-black text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      

      {/* New Chat Modal */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-center items-start pt-10 px-4" onClick={() => setIsNewChatOpen(false)}>
          <div className="bg-[#111] w-full max-w-[500px] rounded-2xl border border-slate-800 p-4 shadow-2xl flex flex-col max-h-[80vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-2">
              <button onClick={() => setIsNewChatOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
              <h2 className="text-lg font-bold text-white">رسالة جديدة</h2>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute right-3 top-3 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder="ابحث عن أشخاص..."
                className="w-full bg-slate-900 border border-slate-700 rounded-full py-2.5 pr-10 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-slate-500">جاري البحث...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map(user => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleStartChat(user.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden shrink-0">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-[15px]">{user.first_name ? `${user.first_name} ${user.last_name||''}` : user.username}</span>
                        <span className="text-slate-500 text-sm">@{user.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-4 text-slate-500">لم يتم العثور على نتائج.</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
