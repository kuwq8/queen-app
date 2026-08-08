'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Send, Mic, Square, Trash2, Image as ImageIcon, Phone, Video, MoreVertical, Edit2, Star, Check, Users, Plus, Smile, Timer } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ChatMessage from '@/components/chat/ChatMessage';

export default function ChatRoomPage() {
  const router = useRouter();
  const { id: roomId } = useParams();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoPaneOpen, setIsInfoPaneOpen] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [myUsername, setMyUsername] = useState<string>('');
  
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTypingState, setIsTypingState] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Media / Audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isViewOnceEnabled, setIsViewOnceEnabled] = useState(false);

  const supabaseRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      supabaseRef.current = supabase;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/');
      setCurrentUserId(session.user.id);
      
      const myId = session.user.id;
      
      // Get my profile for presence
      const { data: myProfile } = await supabase.from('profiles').select('username').eq('id', myId).single();
      if (myProfile) setMyUsername(myProfile.username);

      // Fetch Room Info
      const { data: roomData } = await supabase
        .from('channels')
        .select(`
          *,
          participants:channel_members(
             user_id,
             user:profiles(id, username, avatar_url, bio)
          )
        `)
        .eq('id', roomId as string)
        .single();
        
      if (roomData) {
        setRoomInfo(roomData);
      }

      // Fetch initial messages
      const { data: msgsData } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, username, full_name, avatar_url),
          message_deletions(user_id),
          message_reactions(*),
          message_viewers(user_id)
        `)
        .eq('channel_id', roomId as string)
        .order('created_at', { ascending: true });
        
      if (msgsData) {
         setMessages(msgsData);
         scrollToBottom();
      }

      // Supabase Realtime
      const channel = supabase.channel(`room:${roomId}`);
      channelRef.current = channel;
      
      const handleRealtimeUpdate = async (payload: any) => {
         if (payload.eventType === 'DELETE' && payload.table === 'messages') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
            return;
         }
         
         const msgId = payload.table === 'messages' ? payload.new.id : payload.new.message_id;
         if (!msgId) return;
         
         const { data: updatedMsg } = await supabase.from('messages')
            .select('*, sender:profiles!sender_id(id, username, full_name, avatar_url), message_deletions(user_id), message_reactions(*), message_viewers(user_id)')
            .eq('id', msgId).single();
            
         if (updatedMsg) {
            setMessages(prev => {
               if (prev.find(m => m.id === msgId)) {
                  return prev.map(m => m.id === msgId ? updatedMsg : m);
               }
               return [...prev, updatedMsg].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            if (payload.table === 'messages' && payload.eventType === 'INSERT') scrollToBottom();
         }
      };
      
      channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${roomId}` }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_deletions' }, handleRealtimeUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'message_viewers' }, handleRealtimeUpdate)
        .on('presence', { event: 'sync' }, () => {
           const state = channel.presenceState();
           const typers: string[] = [];
           Object.values(state).forEach((presences: any) => {
             presences.forEach((p: any) => {
               if (p.isTyping && p.userId !== myId) {
                  typers.push(p.username);
               }
             });
           });
           setTypingUsers(Array.from(new Set(typers)));
        })
        .subscribe(async (status: string) => {
           if (status === 'SUBSCRIBED') {
              await channel.track({ userId: myId, username: myProfile?.username || 'User', isTyping: false });
           }
        });

    };
    init();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [roomId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setAudioBlob(null); // Clear audio if they pick an image
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setMediaFile(null); // Clear image if they record audio
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('يبدو أنك لم تسمح للمتصفح باستخدام الميكروفون. يرجى إعطاء الصلاحية.');
      } else {
        alert('حدث خطأ أثناء محاولة الوصول للميكروفون.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelMedia = () => {
    setAudioBlob(null);
    setMediaFile(null);
    setMediaPreview(null);
    setIsViewOnceEnabled(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !audioBlob && !mediaFile) return;

    const supabase = supabaseRef.current;

    if (editingMessageId) {
       await supabase.from('messages').update({ content: newMessage }).eq('id', editingMessageId);
       setEditingMessageId(null);
       setNewMessage('');
       return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    channelRef.current?.track({ userId: currentUserId, username: myUsername, isTyping: false });
    setIsTypingState(false);

    let finalMediaUrl = null;

    if (audioBlob || mediaFile) {
      const file = audioBlob || mediaFile!;
      const fileExt = audioBlob ? 'webm' : file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat/${roomId}/${fileName}`;
      
      const bucketName = isViewOnceEnabled ? 'private_media' : 'media';

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (!error && data) {
        if (isViewOnceEnabled) {
           finalMediaUrl = filePath; // For private_media, we store the path to generate signed URLs later
        } else {
           const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(filePath);
           finalMediaUrl = publicUrlData.publicUrl;
        }
      } else {
        alert('حدث خطأ أثناء رفع الملف. هل تأكدت من إنشاء سلة (Bucket) في Supabase؟ التفاصيل: ' + JSON.stringify(error));
        return;
      }
    }
    
    // Calculate expires_at if disappearing messages are enabled
    let expiresAt = null;
    if (roomInfo?.disappearing_timer && roomInfo.disappearing_timer !== 'OFF') {
      const timerMap: Record<string, number> = {
        '30 seconds': 30 * 1000,
        '5 minutes': 5 * 60 * 1000,
        '1 hour': 60 * 60 * 1000,
        '24 hours': 24 * 60 * 60 * 1000,
        '7 days': 7 * 24 * 60 * 60 * 1000
      };
      const ms = timerMap[roomInfo.disappearing_timer] || null;
      if (ms) {
         expiresAt = new Date(Date.now() + ms).toISOString();
      }
    }

    const { data: insertData, error: insertError } = await supabase.from('messages').insert({
      channel_id: roomId,
      sender_id: currentUserId,
      content: newMessage,
      media_url: finalMediaUrl,
      is_view_once: isViewOnceEnabled,
      expires_at: expiresAt
    }).select('*, sender:profiles!sender_id(id, username, full_name, avatar_url), message_deletions(user_id), message_reactions(*), message_viewers(user_id)').single();
    
    if (insertError) {
       console.error("Message insert error:", insertError);
       alert('فشل إرسال الرسالة: ' + JSON.stringify(insertError));
       return;
    }

    if (insertData) {
       setMessages(prev => [...prev, insertData]);
       scrollToBottom();
    }

    setNewMessage('');
    cancelMedia();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTypingState) {
      setIsTypingState(true);
      channelRef.current?.track({ userId: currentUserId, username: myUsername, isTyping: true });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      channelRef.current?.track({ userId: currentUserId, username: myUsername, isTyping: false });
    }, 2000);
  };
  
  const deleteMessage = async (id: string) => {
     await supabaseRef.current.from('messages').delete().eq('id', id);
  };

  let chatTitle = 'دردشة';
  let chatAvatar = null;
  let chatSubtext = '';
  
  if (roomInfo) {
    if (roomInfo.is_group) {
      chatTitle = roomInfo.name || 'دردشة جماعية';
      chatSubtext = `${roomInfo.participants.length} أعضاء`;
    } else {
      const otherUser = roomInfo.participants.find((p: any) => p.user_id !== currentUserId)?.user;
      if (otherUser) {
        chatTitle = otherUser.username;
        chatAvatar = otherUser.avatar_url;
        chatSubtext = 'متصل';
      }
    }
  }
  
  if (typingUsers.length > 0) {
    chatSubtext = `${typingUsers.join(' و ')} يكتب الآن...`;
  }

  return (
    <div className="flex h-screen bg-black text-white max-w-[900px] mx-auto border-x border-slate-800 relative overflow-hidden font-sans text-right">
      {/* Main Chat Area */}
      <div className={`flex flex-col h-full flex-1 transition-all duration-300 ${isInfoPaneOpen ? 'sm:ml-[300px]' : ''}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
              <ArrowRight size={20} />
            </button>
            <div 
              onClick={() => setIsInfoPaneOpen(true)}
              className="flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 p-1.5 -mr-1.5 rounded-xl transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {chatAvatar ? (
                  <img src={chatAvatar} className="w-full h-full object-cover" />
                ) : roomInfo?.is_group ? (
                  <Users size={20} className="text-slate-400" />
                ) : (
                  <span className="font-bold text-lg" dir="ltr">{chatTitle.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight" dir="ltr">{chatTitle}</h2>
                <p className={`text-xs ${typingUsers.length > 0 ? 'text-cyan-500 font-bold animate-pulse' : 'text-slate-500'}`}>{chatSubtext}</p>
              </div>
            </div>
          </div>
        <div className="flex items-center gap-1 text-cyan-500 relative">
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors"><Phone size={20} /></button>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors"><Video size={20} /></button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <MoreVertical size={20} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-12 left-0 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-right">
              <button onClick={() => { setIsMenuOpen(false); setIsInfoPaneOpen(true); }} className="w-full text-right px-4 py-2 hover:bg-slate-800 transition-colors text-white">
                {roomInfo?.is_group ? 'معلومات المجموعة' : 'معلومات جهة الاتصال'}
              </button>
              <button className="w-full text-right px-4 py-2 hover:bg-slate-800 transition-colors text-red-400">
                حظر المستخدم
              </button>
              <button onClick={() => { setMessages([]); setIsMenuOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-800 transition-colors text-red-400">
                مسح السجل
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden">
        {messages.map((msg, idx) => {
          const isMe = msg.sender?.id === currentUserId;
          const showAvatar = idx === 0 || messages[idx - 1].sender?.id !== msg.sender?.id;
          
          // Filter out deleted for me
          if (msg.message_deletions?.some((d: any) => d.user_id === currentUserId)) {
            return null;
          }

          return (
            <ChatMessage 
              key={msg.id} 
              msg={msg} 
              isMe={isMe} 
              showAvatar={showAvatar} 
              currentUserId={currentUserId!} 
              roomInfo={roomInfo} 
              onEdit={() => { setEditingMessageId(msg.id); setNewMessage(msg.content); }}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 px-2 sm:px-3 py-2 bg-black">
        {(audioBlob || mediaPreview) && (
          <div className="mb-2 flex items-center gap-3 bg-slate-900/80 p-2 rounded-xl border border-slate-800 relative">
            {audioBlob ? (
              <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" />
            ) : (
              <img src={mediaPreview!} className="h-16 w-auto rounded-lg object-cover" />
            )}
            
            {!audioBlob && (
              <button 
                onClick={() => setIsViewOnceEnabled(!isViewOnceEnabled)} 
                className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${isViewOnceEnabled ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}
              >
                <Timer size={14}/> {isViewOnceEnabled ? 'تعرض مرة واحدة' : 'عادية'}
              </button>
            )}

            <button onClick={cancelMedia} className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-full">
              <Trash2 size={18} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-[6px]">
          <input type="file" ref={mediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
          <button 
            onClick={() => mediaInputRef.current?.click()}
            className="w-[40px] h-[40px] flex items-center justify-center bg-slate-800 text-cyan-500 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"
          >
            <Plus size={20} />
          </button>
          
          <div className="flex-1 bg-slate-900 rounded-[20px] border border-slate-800 focus-within:border-cyan-500 transition-colors flex items-end px-[14px] min-h-[40px] relative">
            <textarea
              placeholder={editingMessageId ? "تعديل الرسالة..." : isRecording ? "جاري تسجيل رسالة صوتية..." : "اكتب رسالة..."}
              value={newMessage}
              onChange={handleInputChange}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                }
              }}
              disabled={isRecording}
              className="flex-1 bg-transparent text-white focus:outline-none text-[15px] resize-none py-[10px] min-h-[40px] max-h-[120px] leading-tight [&::-webkit-scrollbar]:hidden"
              rows={1}
              style={{ overflowY: 'auto' }}
            />
            <div className="flex items-center h-[40px]">
              {editingMessageId && (
                <button 
                  onClick={() => { setEditingMessageId(null); setNewMessage(''); }}
                  className="mr-2 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
              <button className="w-[32px] h-[40px] flex items-center justify-center text-slate-400 hover:text-cyan-500 transition-colors -ml-2">
                 <Smile size={22} />
              </button>
            </div>
          </div>

          {!audioBlob && !mediaFile && !newMessage.trim() && !editingMessageId ? (
            isRecording ? (
              <button 
                onClick={stopRecording}
                className="w-[40px] h-[40px] flex items-center justify-center bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors animate-pulse flex-shrink-0 shadow-lg shadow-red-500/20"
              >
                <Square size={20} fill="currentColor" />
              </button>
            ) : (
              <button 
                onClick={startRecording}
                className="w-[40px] h-[40px] flex items-center justify-center bg-cyan-600 text-white hover:bg-cyan-700 rounded-full transition-colors flex-shrink-0 shadow-lg shadow-cyan-600/20"
              >
                <Mic size={20} />
              </button>
            )
          ) : (
            <button 
              onClick={(e) => {
                sendMessage();
                const textarea = document.querySelector('textarea');
                if (textarea) textarea.style.height = 'auto';
              }}
              className={`w-[40px] h-[40px] flex items-center justify-center text-white rounded-full transition-colors flex-shrink-0 shadow-lg ${editingMessageId ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'}`}
            >
              {editingMessageId ? <Check size={20} /> : <Send size={20} className="transform rotate-180 -ml-1" />}
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Info Pane */}
      <div 
        className={`absolute top-0 left-0 h-full w-full sm:w-[300px] bg-[#111] border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 transform ${isInfoPaneOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0">
          <button onClick={() => setIsInfoPaneOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowRight size={20} />
          </button>
          <h3 className="font-bold text-lg">{roomInfo?.is_group ? 'معلومات المجموعة' : 'معلومات جهة الاتصال'}</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col items-center border-b border-slate-800 bg-black/40">
            <div className="w-24 h-24 rounded-full bg-slate-800 mb-4 flex items-center justify-center overflow-hidden border-4 border-[#111] shadow-xl">
              {chatAvatar ? (
                <img src={chatAvatar} className="w-full h-full object-cover" />
              ) : roomInfo?.is_group ? (
                <Users size={40} className="text-slate-400" />
              ) : (
                <span className="font-bold text-3xl" dir="ltr">{chatTitle.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold" dir="ltr">{chatTitle}</h2>
            {roomInfo?.is_group && (
              <p className="text-slate-500 mt-1">مجموعة · {roomInfo.participants?.length} مشاركين</p>
            )}
            {!roomInfo?.is_group && (
              <p className="text-slate-500 mt-1" dir="ltr">@{chatTitle}</p>
            )}
          </div>

          {!roomInfo?.is_group && roomInfo?.participants && (
            <div className="p-4 border-b border-slate-800 bg-black/20">
              <h4 className="text-sm font-bold text-cyan-500 mb-2">حول</h4>
              <p className="text-[15px] text-slate-300">
                {roomInfo.participants.find((p: any) => p.user_id !== currentUserId)?.user?.bio || "لا توجد نبذة."}
              </p>
            </div>
          )}

          {roomInfo?.is_group && roomInfo?.participants && (
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-bold text-cyan-500">
                {roomInfo.participants.length} مشاركون
              </div>
              <div className="divide-y divide-slate-800/50">
                {roomInfo.participants.map((p: any) => (
                  <div key={p.user_id} className="flex items-center gap-3 p-4 hover:bg-slate-900 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.user?.avatar_url ? (
                        <img src={p.user.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm" dir="ltr">{p.user?.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] truncate flex justify-between">
                        <span>{p.user_id === currentUserId ? 'أنت' : <span dir="ltr">{p.user?.username}</span>}</span>
                      </div>
                      <div className="text-sm text-slate-500 truncate" dir="ltr">@{p.user?.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
