'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Send, User, Phone, Video, Image as ImageIcon, Smile, MessageCircle, Mic, Loader } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function ChatRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const conversationId = params.id;

  const handleCall = async (type: 'audio' | 'video') => {
    if (!otherUser) return;
    try {
      const supabase = createClient();
      
      const { data: call, error } = await supabase.from('calls').insert({
        caller_id: currentUserId,
        receiver_id: otherUser?.id,
        call_type: type,
        status: 'ringing'
      }).select().single();

      if (error) {
        alert(error.message || 'فشل بدء المكالمة بسبب إعدادات الخصوصية.');
        return;
      }

      if (call) {
        router.push(`/call/${call.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('فشل بدء المكالمة');
    }
  };

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
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
        .select('user_id, profiles(id, username, first_name, last_name, avatar_url)')
        .eq('conversation_id', conversationId);

      if (!participants || participants.length === 0) {
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

      // 4. Subscribe to new messages and presence
      const channel = supabase.channel(`conversation_${conversationId}`);
      channelRef.current = channel;

      channel
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, async (payload) => {
          setMessages(prev => {
            // Check if message already exists (optimistic UI)
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_id !== session.user.id) {
            await markAsRead(supabase, session.user.id);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const isOtherOnline = Object.values(state).some((presenceList: any) => 
            presenceList.some((p: any) => p.user_id === (((otherParticipant as any)?.profiles?.[0]?.id || (otherParticipant as any)?.profiles?.id)))
          );
          setIsOnline(isOtherOnline);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user_id: session.user.id });
          }
        });

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

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);
      
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}_${Date.now()}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;
      
      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('chat_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;
      
      setUploadProgress(80);

      const { data: { publicUrl } } = supabase.storage
        .from('chat_media')
        .getPublicUrl(filePath);

      const mediaType = file.type.startsWith('audio/') ? 'audio' : 'image';

      setUploadProgress(95);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: '',
          media_url: publicUrl,
          media_type: mediaType,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update conversations timestamp
      await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);

    } catch (err: any) {
      console.error(err);
      alert('فشل الرفع: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(''); // Optimistic clear

    // Optimistic insert
    const tempId = `temp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content,
      created_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages(prev => [...prev, newMsg]);

    try {
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
        alert(error.message || 'فشل إرسال الرسالة.');
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else {
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        
        // Update conversation updated_at
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-right" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="md:hidden text-slate-400 hover:text-white p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowRight size={24} />
          </Link>
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => otherUser && router.push(`/${otherUser?.username}`)}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                {otherUser?.avatar_url ? (
                  <img src={otherUser?.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base leading-tight">
                {isLoading ? '...' : (otherUser?.first_name ? `${otherUser?.first_name} ${otherUser?.last_name||''}` : otherUser?.username)}
              </span>
              <span className="text-slate-400 text-xs">
                {isLoading ? '...' : (isOnline ? 'متصل الآن' : `@${otherUser?.username}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => handleCall('audio')} className="text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
            <Phone size={20} />
          </button>
          <button onClick={() => handleCall('video')} className="text-cyan-500 hover:text-cyan-400 p-2 rounded-full hover:bg-slate-800 transition-colors">
            <Video size={20} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري التحميل...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-slate-700" />
            </div>
            <p className="font-bold text-white mb-1">بدء المحادثة</p>
            <p className="text-sm">أرسل رسالة لبدء الدردشة.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const showTail = idx === messages.length - 1 || messages[idx + 1].sender_id !== msg.sender_id;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mb-2' : 'mb-0.5'}`}>
                <div 
                  className={`max-w-[75%] px-4 py-2 text-[15px] relative group ${
                    isMe 
                      ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm' 
                      : 'bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm'
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  
                  {msg.media_url && msg.media_type === 'image' && (
                    <img src={msg.media_url} alt="media" className="rounded-xl mb-1 max-w-full" style={{ maxHeight: '200px' }} />
                  )}
                  {msg.media_url && msg.media_type === 'audio' && (
                    <audio src={msg.media_url} controls className="max-w-[200px] h-8 mb-1" />
                  )}
                  {msg.content}

                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-cyan-200' : 'text-slate-400'} text-[10px]`}>
                    <span>{new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}</span>
                    {isMe && (
                      <span>
                        {msg.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="p-3 bg-black border-t border-slate-800 flex flex-col">
        {isUploading && (
          <div className="px-4 py-2 flex items-center justify-between text-xs text-cyan-500 bg-slate-900 border border-slate-800 rounded-lg mb-2">
            <span className="flex items-center gap-2"><Loader size={14} className="animate-spin" /> جاري الرفع...</span>
            <span>{uploadProgress}%</span>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,audio/*" />
          <div className="flex-1 bg-slate-900 border border-slate-700 rounded-3xl flex items-center p-1 focus-within:border-cyan-500 transition-colors">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-cyan-500 transition-colors rounded-full shrink-0" title="إرفاق ملف">
              <ImageIcon size={20} />
            </button>
            <button type="button" onClick={() => alert('تسجيل الصوت يتطلب صلاحيات الميكروفون (قيد التطوير)')} className="p-2 text-slate-400 hover:text-cyan-500 transition-colors rounded-full shrink-0" title="تسجيل صوتي">
              <Mic size={20} />
            </button>
            <button type="button" className="p-2 text-slate-400 hover:text-cyan-500 transition-colors rounded-full shrink-0">
              <Smile size={20} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="اكتب رسالة..."
              className="flex-1 bg-transparent text-white px-2 py-2 outline-none text-[15px]"
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-800 transition-colors shrink-0"
          >
            <Send size={18} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
