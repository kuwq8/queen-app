'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Send, User, Phone, Video } from 'lucide-react';
import Link from 'next/link';

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = params.id;

  const handleCall = async (type: 'audio' | 'video') => {
    if (!otherUser) return;
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      // 1. Create a call record
      const { data: call, error } = await supabase.from('calls').insert({
        caller_id: currentUserId,
        receiver_id: otherUser.id,
        call_type: type,
        status: 'ringing'
      }).select().single();

      if (error) {
        alert(error.message || 'فشل بدء المكالمة بسبب إعدادات الخصوصية.');
        return;
      }

      if (call) {
        // Realtime signaling is now securely handled by postgres_changes on the calls table insert.

        // 3. Navigate to Call Room
        router.push(`/call/${call.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('فشل بدء المكالمة');
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [conversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchInitialData = async () => {
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

      // 1. Verify participant and get other user
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id, profiles(id, username, avatar_url)')
        .eq('conversation_id', conversationId);

      if (!participants || participants.length === 0) {
        // Conversation doesn't exist or user not allowed
        router.push('/messages');
        return;
      }

      const isParticipant = participants.some(p => p.user_id === session.user.id);
      if (!isParticipant) {
        router.push('/messages');
        return;
      }

      const otherParticipant = participants.find(p => p.user_id !== session.user.id);
      if (otherParticipant && otherParticipant.profiles) {
        setOtherUser(otherParticipant.profiles);
      }

      // 2. Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages(msgs);
      }

      // 3. Mark messages as read and update last_read_at
      await markAsRead(supabase, session.user.id);

      // 4. Subscribe to new messages
      const channel = supabase.channel(`conversation_${conversationId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, async (payload) => {
          setMessages(prev => [...prev, payload.new]);
          if (payload.new.sender_id !== session.user.id) {
            await markAsRead(supabase, session.user.id);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (supabase: any, userId: string) => {
    // Update messages to is_read = true where sender != user
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    // Update last_read_at
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        alert(error.message || 'فشل إرسال الرسالة بسبب إعدادات الخصوصية أو الحظر.');
        // Optionally revert Optimistic clear if we didn't fetch it via Realtime fast enough
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 h-screen bg-black" dir="rtl">
        {/* Header */}
        <header className="bg-black/90 backdrop-blur-md flex items-center justify-between px-4 py-3 border-b border-slate-800 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/messages')} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
              <ArrowRight className="text-white" size={20} />
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push(`/${otherUser?.username}`)}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                {otherUser?.avatar_url ? (
                  <img src={otherUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-[15px]">{otherUser?.username || 'جاري التحميل...'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => handleCall('audio')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-500/10 transition-colors"
            >
              <Phone size={20} />
            </button>
            <button 
              onClick={() => handleCall('video')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sky-500 hover:bg-sky-500/10 transition-colors"
            >
              <Video size={20} />
            </button>
          </div>
        </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col pb-[80px]">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-pulse text-cyan-500 font-bold">جاري تحميل المحادثة...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-slate-500">
            <p className="font-bold text-lg mb-2">أرسل رسالة لبدء المحادثة</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'} w-full`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[15px] ${
                  isMe ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-slate-500 text-[10px] mt-1 mx-1">
                  {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input */}
      <footer className="absolute bottom-0 w-full bg-black border-t border-slate-800 p-3 flex items-center justify-center">
        <form onSubmit={handleSendMessage} className="w-full max-w-2xl relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالة..."
            className="w-full bg-slate-900 border border-slate-700 text-white rounded-full py-3 pr-4 pl-12 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white flex items-center justify-center transition-colors"
          >
            <Send size={16} className="-ml-1" />
          </button>
        </form>
      </footer>
    </div>
  );
}
