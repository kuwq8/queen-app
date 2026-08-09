'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Send, Mic, Square, Trash2, Image as ImageIcon, Phone, Video, MoreVertical, Edit2, Star, Check, Users, Plus, Smile, Timer, X, Bell, List, LogOut } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { createClient } from '@/utils/supabase/client';
import ChatMessage from '@/components/chat/ChatMessage';

export default function ChatRoomPage() {
  const router = useRouter();
  const { id: roomId } = useParams();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoPaneOpen, setIsInfoPaneOpen] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [myUsername, setMyUsername] = useState<string>('');
  const [myProfile, setMyProfile] = useState<any>(null);
  
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

  // Bot Announcements Timer (Runs every 10 minutes)
  useEffect(() => {
    const botMessages = [
       { title: 'فعاليه', body: 'يسرنا دعوتكم للمشاركة في فعالية زاجل كل يوم احد الساعه التاسعه مساء تحت شعار: "ارسل رسالة لمن تحب" مع كوين' },
       { title: 'توجيه إداري مُهِمّ', body: 'نرجو من جميع السوابر والاداريين دون إستثناء, عدم إساءة إستخدام الصلاحيات(الحظر أو الطرد) لغير أحد الاسباب التاليه [فلوده,عزايم,قذف] وسيتم سحب الصلاحيه لو أستخدم لغير ماذكر.. الإداره' },
       { title: 'مبدع الحائط', body: 'c7sas ontha مبدع الحائط لهذا الأسبوع' }
    ];
    let msgIndex = 0;

    const interval = setInterval(() => {
       const botMsg = botMessages[msgIndex % botMessages.length];
       msgIndex++;
       const newMsg = {
          id: `bot-${Date.now()}`,
          channel_id: roomId,
          sender_id: null,
          content: `${botMsg.title}|${botMsg.body}`,
          media_type: 'bot_announcement',
          created_at: new Date().toISOString(),
          sender: null,
          message_reactions: [],
          message_deletions: [],
          message_viewers: []
       };
       setMessages(prev => {
          const updated = [...prev, newMsg];
          setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
          return updated;
       });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      supabaseRef.current = supabase;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/');
      setCurrentUserId(session.user.id);
      
      const myId = session.user.id;
      
      // Get my profile for presence
      const { data: myProfileData } = await supabase.from('profiles').select('*').eq('id', myId).single();
      if (myProfileData) {
         setMyUsername(myProfileData.username);
         setMyProfile(myProfileData);
      }

      // Fetch Room Info
      const { data: roomData } = await supabase
        .from('channels')
        .select(`*, participants:channel_members(user_id)`)
        .eq('id', roomId as string)
        .single();
        
      if (roomData) {
        if (!roomData.is_group) {
          const otherUserId = roomData.participants?.find((p: any) => p.user_id !== myId)?.user_id;
          if (otherUserId) {
             const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
             roomData.otherProfile = otherProfile;
          }
        }
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
         
         // Mark unread messages as read
         const unreadMsgs = msgsData.filter((m: any) => m.sender_id !== myId && !m.message_viewers?.some((v: any) => v.user_id === myId));
         if (unreadMsgs.length > 0) {
            const viewRecords = unreadMsgs.map((m: any) => ({ message_id: m.id, user_id: myId }));
            supabase.from('message_viewers').insert(viewRecords).then();
         }
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

    const tempId = crypto.randomUUID();
    const tempMsg: any = {
      id: tempId,
      channel_id: roomId,
      sender_id: currentUserId,
      content: newMessage,
      media_url: finalMediaUrl,
      is_view_once: isViewOnceEnabled,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        username: myUsername,
        full_name: myProfile?.full_name,
        avatar_url: myProfile?.avatar_url
      },
      message_reactions: [],
      message_deletions: [],
      message_viewers: []
    };

    if (replyingToMessage) {
       tempMsg.reply_to = replyingToMessage;
    }

    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();
    
    const currentMessageText = newMessage;
    setNewMessage('');
    cancelMedia();

    let insertPayload: any = {
      id: tempId,
      channel_id: roomId,
      sender_id: currentUserId,
      content: currentMessageText,
      media_url: finalMediaUrl,
      is_view_once: isViewOnceEnabled,
      expires_at: expiresAt
    };

    // Include reply context in JSON if column doesn't exist, or just rely on fallback.
    // For simplicity, we just store it in content if it fails, or maybe just ignore it.
    // Since we know reply_to_message_id doesn't exist, we will safely append it to JSON metadata or content for now.
    // Wait, let's append it to content invisibly or just as quoted text? 
    // We can't change DB schema easily here, so we will append it to content stringified if it fails!
    
    if (replyingToMessage) {
        insertPayload.content = `[REPLY:${replyingToMessage.id}:${replyingToMessage.sender?.username || 'user'}:${replyingToMessage.content?.substring(0,20) || ''}] \n${currentMessageText}`;
    }
    setReplyingToMessage(null);

    let { data: insertData, error: insertError } = await supabase.from('messages')
       .insert(insertPayload)
       .select('*, sender:profiles!sender_id(id, username, full_name, avatar_url), message_deletions(user_id), message_reactions(*), message_viewers(user_id)')
       .single();
    
    if (insertError) {
       console.error("Message insert error:", insertError);
       setMessages(prev => prev.filter(m => m.id !== tempId));
       setNewMessage(currentMessageText);
       alert('فشل إرسال الرسالة: ' + JSON.stringify(insertError));
       return;
    }

    if (insertData) {
       // Parse reply tag back if it exists to maintain temp state visual, or let real-time update handle it
       if (insertData.content && insertData.content.startsWith('[REPLY:')) {
           const match = insertData.content.match(/\[REPLY:(.*?):(.*?):(.*?)\] \n(.*)/s);
           if (match) {
              insertData.reply_to = {
                  id: match[1],
                  sender: { username: match[2] },
                  content: match[3]
              };
              insertData.content = match[4];
           }
       }
       setMessages(prev => prev.map(m => m.id === tempId ? insertData : m));
    }
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

  const handleReaction = (msgId: string, reaction: string) => {
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const newReactions = [...(m.message_reactions || []), { message_id: msgId, user_id: currentUserId, reaction }];
        return { ...m, message_reactions: newReactions };
      }
      return m;
    }));
  };

  let chatTitle = 'دردشة';
  let chatAvatar = null;
  let chatSubtext = '';
  
  if (roomInfo) {
    if (roomInfo.is_group) {
      chatTitle = roomInfo.name || 'دردشة جماعية';
      chatSubtext = `${roomInfo.participants.length} أعضاء`;
    } else {
      const otherUser = roomInfo.otherProfile;
      if (otherUser) {
        chatTitle = otherUser.full_name || otherUser.username;
        chatAvatar = otherUser.avatar_url;
        chatSubtext = 'متصل';
      }
    }
  }
  
  if (typingUsers.length > 0) {
    chatSubtext = `${typingUsers.join(' و ')} يكتب الآن...`;
  }

  return (
    <div className="w-full h-dvh max-w-md mx-auto flex flex-col bg-black overflow-hidden text-white relative font-sans text-right shadow-2xl">
      {/* Main Chat Area */}
      <div className={`flex flex-col h-full flex-1 transition-all duration-300 ${isInfoPaneOpen ? 'sm:ml-[300px]' : ''}`}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 h-16 pt-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center -mr-3 rounded-full hover:bg-white/5 transition-colors">
              <ArrowRight size={20} className="text-white" />
            </button>
            <div 
              onClick={() => setIsInfoPaneOpen(true)}
              className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-1 -ml-1 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {chatAvatar ? (
                  <img src={chatAvatar} className="w-full h-full object-cover" />
                ) : roomInfo?.is_group ? (
                  <Users size={16} className="text-slate-400" />
                ) : (
                  <span className="font-bold text-sm" dir="ltr">{chatTitle.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-[14px] font-semibold text-white leading-tight" dir="ltr">{chatTitle}</h2>
                <p className={`text-[11px] ${typingUsers.length > 0 ? 'text-cyan-500 font-bold animate-pulse' : 'text-slate-500'}`}>{chatSubtext}</p>
              </div>
            </div>
          </div>
        <div className="flex items-center text-cyan-500 relative">
          <button className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"><Phone size={20} /></button>
          <button className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"><Video size={20} /></button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
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
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender?.id !== msg.sender?.id);
          
          // Filter out deleted for me
          if (msg.message_deletions?.some((d: any) => d.user_id === currentUserId)) {
            return null;
          }

          // Handle reply tag parsing
          let displayMsg = { ...msg };
          if (displayMsg.content && displayMsg.content.startsWith('[REPLY:')) {
             const match = displayMsg.content.match(/\[REPLY:(.*?):(.*?):(.*?)\] \n(.*)/s);
             if (match) {
                displayMsg.reply_to = {
                    id: match[1],
                    sender: { username: match[2] },
                    content: match[3]
                };
                displayMsg.content = match[4];
             }
          }

          return (
            <ChatMessage 
              key={displayMsg.id} 
              msg={displayMsg} 
              isMe={isMe} 
              showAvatar={showAvatar} 
              currentUserId={currentUserId!} 
              roomInfo={roomInfo} 
              onEdit={() => { setEditingMessageId(displayMsg.id); setNewMessage(displayMsg.content); }}
              onReact={handleReaction}
              onReply={(m) => setReplyingToMessage(m)}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Notification Bell Badge */}
      <div className="fixed right-4 bottom-32 sm:bottom-24 sm:right-[calc(50%-200px+1rem)] z-30 flex items-center justify-center w-10 h-10 rounded-full bg-rose-500 text-white shadow-lg cursor-pointer hover:bg-rose-600 transition-colors">
        <Bell size={20} />
        <span className="absolute -top-1 -left-1 bg-white text-rose-600 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-rose-500 shadow-sm">
          {0}
        </span>
      </div>

      {/* Input Area */}
      <div className="bg-[#b4ad9b] flex flex-col w-full sticky bottom-0 z-40 pb-safe">
        {(audioBlob || mediaPreview) && (
          <div className="mb-1 flex items-center gap-3 bg-slate-900/90 p-2 border-t border-slate-800 relative shadow-md">
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

            <button onClick={cancelMedia} className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-full transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowEmojiPicker(false)} />
            <div className="fixed bottom-24 left-0 w-full z-50 bg-[#181824] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <EmojiPicker
                theme={Theme.DARK}
                onEmojiClick={(e: EmojiClickData) => { setNewMessage(prev => prev + e.emoji); }}
                width="100%"
                height={300}
                searchPlaceHolder="بحث عن رموز تعبيرية..."
              />
            </div>
          </>
        )}

        <div className="flex flex-col w-full z-50">
          
          {replyingToMessage && (
            <div className="flex items-center justify-between bg-[#1f1d2b] border-l-2 border-sky-400 p-2 px-3 text-xs w-full shadow-md z-10">
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="font-bold text-sky-400 text-[11px] truncate">
                  الرد على {replyingToMessage.sender?.username || replyingToMessage.sender?.full_name || 'الرسالة'}
                </span>
                <span className="text-gray-300 truncate text-[11px]">
                  {replyingToMessage.content}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setReplyingToMessage(null)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0 mr-2 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Top Row: Input field and actions */}
          <div className="flex items-center gap-1 p-1 bg-[#b4ad9b] w-full">
            <button className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-700 bg-black/5 rounded">
              <LogOut size={18} className="rotate-180" />
            </button>
            
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-700 bg-white rounded shadow-sm">
              <Smile size={18} />
            </button>

            <div className="flex-1 min-w-0 relative">
              <input 
                 className="w-full bg-white text-black px-3 py-1.5 rounded border border-gray-300 text-sm focus:outline-none focus:border-gray-400 shadow-inner"
                 placeholder={editingMessageId ? "تعديل الرسالة..." : isRecording ? "جاري تسجيل رسالة صوتية..." : "اكتب @ للإشارة إلى احد المستخدمين"}
                 value={newMessage}
                 onChange={handleInputChange}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     sendMessage();
                   }
                 }}
                 disabled={isRecording}
              />
            </div>

            <button className="w-8 h-8 flex items-center justify-center shrink-0 text-gray-700 bg-white rounded shadow-sm">
              <List size={18} />
            </button>

            {!audioBlob && !mediaFile && !newMessage.trim() && !editingMessageId ? (
              isRecording ? (
                <button 
                  type="button" 
                  onClick={stopRecording}
                  className="px-3 h-8 bg-red-600 text-white rounded text-xs font-bold flex items-center justify-center shrink-0 shadow-md animate-pulse"
                >
                  <Square size={14} fill="currentColor" className="mr-1" /> إيقاف
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={startRecording}
                  className="px-3 h-8 bg-[#58514b] hover:bg-[#4a443e] text-white rounded text-xs font-bold flex items-center justify-center shrink-0 shadow-sm transition-colors"
                >
                  <Mic size={16} className="mr-1" /> تسجيل
                </button>
              )
            ) : (
              <button 
                type="button" 
                onClick={() => sendMessage()}
                className={`px-3 h-8 text-white rounded text-xs font-bold flex items-center justify-center shrink-0 shadow-sm transition-colors ${editingMessageId ? 'bg-green-600' : 'bg-[#58514b] hover:bg-[#4a443e]'}`}
              >
                {editingMessageId ? <Check size={16} /> : <><Send size={14} className="rotate-180 ml-1" /> إرسال</>}
              </button>
            )}
          </div>

          {/* Bottom Row: Grid Nav */}
          <div className="grid grid-cols-5 gap-0.5 p-0.5 bg-[#3a3735] text-white text-xs font-bold text-center w-full">
            <button className="py-1.5 px-1 bg-[#4a443e] hover:bg-[#5a544e] transition-colors flex items-center justify-center gap-1"><Users size={12}/> 173</button>
            <button className="py-1.5 px-1 hover:bg-[#4a443e] transition-colors">خاص</button>
            <button onClick={() => router.push('/messages')} className="py-1.5 px-1 hover:bg-[#4a443e] transition-colors">الغرف</button>
            <button onClick={() => router.push('/home')} className="py-1.5 px-1 hover:bg-[#4a443e] transition-colors">الحائط</button>
            <button className="py-1.5 px-1 hover:bg-[#4a443e] transition-colors">الضبط</button>
          </div>
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
