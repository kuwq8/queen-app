'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, Send, Mic, Square, Trash2, Image as ImageIcon, Phone, Video, MoreVertical, Edit2, Star, Check, Users } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

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

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return router.push('/');
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    setCurrentUserId(payload.sub);

    // Fetch Room Info
    fetch(`${API_URL}/chat/rooms/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setRoomInfo(data));

    // Fetch initial messages
    fetch(`${API_URL}/chat/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setMessages(data.reverse());
      scrollToBottom();
    });

    // Connect WebSocket
    const socket = io(`${API_URL}`, {
      auth: { token: `Bearer ${token}` }
    });
    socketRef.current = socket;

    socket.on('newMessage', (message: any) => {
      if (message.roomId === roomId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
        socket.emit('readMessage', { roomId }); // Mark read
      }
    });

    socket.on('userTyping', (data: any) => {
      if (data.roomId === roomId) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter(u => u !== data.username);
          }
        });
      }
    });

    socket.on('messageRead', (data: any) => {
      if (data.roomId === roomId) {
         setMessages(prev => prev.map(m => ({ ...m, read: true })));
      }
    });

    socket.emit('readMessage', { roomId });

    return () => {
      socket.disconnect();
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
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !audioBlob && !mediaFile) return;

    if (editingMessageId) {
      setMessages(messages.map(m => m.id === editingMessageId ? { ...m, content: newMessage, isEdited: true } : m));
      setEditingMessageId(null);
      setNewMessage('');
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing', { roomId, isTyping: false });
    setIsTypingState(false);

    const token = getToken();
    let mediaUrl = undefined;

    // Upload media/audio if exists via REST API first
    if (audioBlob || mediaFile) {
      const formData = new FormData();
      if (audioBlob) formData.append('file', audioBlob, 'voice-note.webm');
      else if (mediaFile) formData.append('file', mediaFile);

      const uploadRes = await fetch(`${API_URL}/chat/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.mediaUrl;
      }
    }

    // Emit through WebSocket
    socketRef.current?.emit('sendMessage', {
      roomId,
      content: newMessage,
      mediaUrl
    });

    setNewMessage('');
    cancelMedia();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTypingState) {
      setIsTypingState(true);
      socketRef.current?.emit('typing', { roomId, isTyping: true });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      socketRef.current?.emit('typing', { roomId, isTyping: false });
    }, 2000);
  };

  let chatTitle = 'دردشة';
  let chatAvatar = null;
  let chatSubtext = '';
  
  if (roomInfo) {
    if (roomInfo.isGroup) {
      chatTitle = roomInfo.name || 'دردشة جماعية';
      chatSubtext = `${roomInfo.participants.length} أعضاء`;
    } else {
      const otherUser = roomInfo.participants.find((p: any) => p.userId !== currentUserId)?.user;
      if (otherUser) {
        chatTitle = otherUser.username;
        chatAvatar = otherUser.profile?.avatarUrl;
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
                ) : roomInfo?.isGroup ? (
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
                {roomInfo?.isGroup ? 'معلومات المجموعة' : 'معلومات جهة الاتصال'}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender.id === currentUserId;
          const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender.id !== msg.sender.id);
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
              <div className="flex max-w-[75%] items-end gap-2">
                {/* Avatar for others */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {showAvatar ? (
                      msg.sender.profile?.avatarUrl ? (
                        <img src={msg.sender.profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold" dir="ltr">{msg.sender.username.charAt(0).toUpperCase()}</span>
                      )
                    ) : null}
                  </div>
                )}

                {/* Bubble */}
                <div className={`flex flex-col relative group/bubble ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && showAvatar && roomInfo?.isGroup && <span className="text-xs text-slate-500 mr-1 mb-1 font-bold" dir="ltr">{msg.sender.username}</span>}
                  
                  {isMe && !msg.isDeleted && (
                    <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 flex items-center gap-1 transition-opacity">
                      {msg.content && (
                        <button onClick={() => { setEditingMessageId(msg.id); setNewMessage(msg.content); }} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-full">
                          <Edit2 size={14}/>
                        </button>
                      )}
                      <button onClick={() => setMessages(messages.map(m => m.id === msg.id ? {...m, isStarred: !m.isStarred} : m))} className={`p-1.5 bg-slate-800 rounded-full ${msg.isStarred ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}>
                        <Star size={14} fill={msg.isStarred ? "currentColor" : "none"}/>
                      </button>
                      <button onClick={() => setMessages(messages.map(m => m.id === msg.id ? {...m, isDeleted: true} : m))} className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-full">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  )}

                  <div className={`p-3 rounded-2xl ${msg.isDeleted ? 'bg-slate-900 border border-slate-800 text-slate-500 italic' : isMe ? 'bg-cyan-600 rounded-bl-sm' : 'bg-slate-800 rounded-br-sm'} shadow-sm relative`}>
                    {msg.isDeleted ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Trash2 size={14} />
                        <span>تم حذف هذه الرسالة</span>
                      </div>
                    ) : (
                      <>
                        {msg.mediaUrl && (
                          <div className="mb-2">
                            {msg.mediaUrl.endsWith('.webm') ? (
                              <audio src={msg.mediaUrl} controls className="h-10 w-[200px]" />
                            ) : msg.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                              <video src={msg.mediaUrl} controls className="max-w-full rounded-xl max-h-[300px]" />
                            ) : (
                              <img src={msg.mediaUrl} className="max-w-full rounded-xl max-h-[300px] object-cover" />
                            )}
                          </div>
                        )}
                        {msg.content && (
                          <p className={`text-[15px] leading-relaxed break-words ${isMe ? 'text-white' : 'text-slate-200'}`}>
                            {msg.content}
                          </p>
                        )}
                        {msg.isEdited && (
                          <span className="text-[10px] opacity-70 mr-2 italic">معدلة</span>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <Check size={12} className={msg.read ? 'text-blue-500' : 'text-slate-500'} />}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 p-3 bg-black">
        {(audioBlob || mediaPreview) && (
          <div className="mb-3 flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            {audioBlob ? (
              <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 flex-1" />
            ) : (
              <img src={mediaPreview!} className="h-16 w-auto rounded-lg object-cover" />
            )}
            <button onClick={cancelMedia} className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-full">
              <Trash2 size={18} />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input type="file" ref={mediaInputRef} accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
          <button 
            onClick={() => mediaInputRef.current?.click()}
            className="p-2.5 text-cyan-500 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
          >
            <ImageIcon size={20} />
          </button>
          
          <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 focus-within:border-cyan-500 transition-colors flex items-center px-4 py-1.5 min-h-[44px] relative">
            <input
              type="text"
              placeholder={editingMessageId ? "تعديل الرسالة..." : isRecording ? "جاري تسجيل رسالة صوتية..." : "اكتب رسالة"}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isRecording}
              className="flex-1 bg-transparent text-white focus:outline-none text-[15px]"
            />
            {editingMessageId && (
              <button 
                onClick={() => { setEditingMessageId(null); setNewMessage(''); }}
                className="absolute left-3 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {!audioBlob && !mediaFile && !newMessage.trim() && !editingMessageId ? (
            isRecording ? (
              <button 
                onClick={stopRecording}
                className="p-2.5 bg-red-500 text-white hover:bg-red-600 rounded-full transition-colors animate-pulse flex-shrink-0 shadow-lg shadow-red-500/20"
              >
                <Square size={20} fill="currentColor" />
              </button>
            ) : (
              <button 
                onClick={startRecording}
                className="p-2.5 bg-slate-800 text-cyan-500 hover:bg-slate-700 rounded-full transition-colors flex-shrink-0"
              >
                <Mic size={20} />
              </button>
            )
          ) : (
            <button 
              onClick={sendMessage}
              className={`p-2.5 text-white rounded-full transition-colors flex-shrink-0 shadow-lg ${editingMessageId ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20'}`}
            >
              {editingMessageId ? <Check size={20} /> : <Send size={20} className="transform rotate-180" />}
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Info Pane (WhatsApp style side pane) */}
      <div 
        className={`absolute top-0 left-0 h-full w-full sm:w-[300px] bg-[#111] border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 transform ${isInfoPaneOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0">
          <button onClick={() => setIsInfoPaneOpen(false)} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowRight size={20} />
          </button>
          <h3 className="font-bold text-lg">{roomInfo?.isGroup ? 'معلومات المجموعة' : 'معلومات جهة الاتصال'}</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col items-center border-b border-slate-800 bg-black/40">
            <div className="w-24 h-24 rounded-full bg-slate-800 mb-4 flex items-center justify-center overflow-hidden border-4 border-[#111] shadow-xl">
              {chatAvatar ? (
                <img src={chatAvatar} className="w-full h-full object-cover" />
              ) : roomInfo?.isGroup ? (
                <Users size={40} className="text-slate-400" />
              ) : (
                <span className="font-bold text-3xl" dir="ltr">{chatTitle.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold" dir="ltr">{chatTitle}</h2>
            {roomInfo?.isGroup && (
              <p className="text-slate-500 mt-1">مجموعة · {roomInfo.participants?.length} مشاركين</p>
            )}
            {!roomInfo?.isGroup && (
              <p className="text-slate-500 mt-1" dir="ltr">@{chatTitle}</p>
            )}
          </div>

          {!roomInfo?.isGroup && roomInfo?.participants && (
            <div className="p-4 border-b border-slate-800 bg-black/20">
              <h4 className="text-sm font-bold text-cyan-500 mb-2">حول</h4>
              <p className="text-[15px] text-slate-300">
                {roomInfo.participants.find((p: any) => p.userId !== currentUserId)?.user?.profile?.bio || "لا توجد نبذة."}
              </p>
            </div>
          )}

          {roomInfo?.isGroup && roomInfo?.participants && (
            <div className="mt-2">
              <div className="px-4 py-2 text-sm font-bold text-cyan-500">
                {roomInfo.participants.length} مشاركون
              </div>
              <div className="divide-y divide-slate-800/50">
                {roomInfo.participants.map((p: any) => (
                  <div key={p.userId} className="flex items-center gap-3 p-4 hover:bg-slate-900 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.user.profile?.avatarUrl ? (
                        <img src={p.user.profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm" dir="ltr">{p.user.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[15px] truncate flex justify-between">
                        <span>{p.userId === currentUserId ? 'أنت' : <span dir="ltr">{p.user.username}</span>}</span>
                      </div>
                      <div className="text-sm text-slate-500 truncate" dir="ltr">@{p.user.username}</div>
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
