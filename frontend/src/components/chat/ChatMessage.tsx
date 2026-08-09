import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Forward, Eye, Check, CheckCheck, Reply, Clock, Pin, CheckCircle, ChevronDown, Search, Plus, X } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { createClient } from '@/utils/supabase/client';

interface ChatMessageProps {
  msg: any;
  isMe: boolean;
  showAvatar: boolean;
  currentUserId: string;
  roomInfo: any;
  onEdit: () => void;
  onReact?: (msgId: string, reaction: string) => void;
  onReply?: (msg: any) => void;
}

export default function ChatMessage({ msg, isMe, showAvatar, currentUserId, roomInfo, onEdit, onReact, onReply }: ChatMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [menuPos, setMenuPos] = useState<any>(null);
  
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const [viewOnceUrl, setViewOnceUrl] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Check if media is viewed
  const isViewed = msg.message_viewers?.some((v: any) => v.user_id === currentUserId);
  const isDeleted = msg.is_deleted;

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.type === 'touchstart') {
        touchStartY.current = (e as React.TouchEvent).touches[0].clientY;
    }
    
    timerRef.current = setTimeout(() => {
      if (messageRef.current) {
         setShowFullPicker(false);
         setShowMenu(true);
      }
    }, 500);
  };

  const closeMenu = () => {
    setShowMenu(false);
    setShowFullPicker(false);
  };

  const handleEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    if (Math.abs(currentY - touchStartY.current) > 5) {
       if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  const deleteForMe = async () => {
    const supabase = createClient();
    await supabase.from('message_deletions').insert({ message_id: msg.id, user_id: currentUserId });
    setShowMenu(false);
  };

  const deleteForEveryone = async () => {
    const supabase = createClient();
    const { error } = await supabase.from('messages').update({ is_deleted: true, deleted_by: currentUserId, deleted_at: new Date().toISOString() }).eq('id', msg.id);
    if (error) {
      alert('فشل الحذف لدى الجميع، ربما لا تملك الصلاحية أو أن الأعمدة (is_deleted) غير موجودة بالجدول: ' + error.message);
      console.error(error);
    }
    setShowMenu(false);
  };
  
  const addReaction = async (reaction: string) => {
    if (onReact) {
      onReact(msg.id, reaction);
    }
    setShowMenu(false);
    
    const supabase = createClient();
    const { error } = await supabase.from('message_reactions').insert({ message_id: msg.id, user_id: currentUserId, reaction });
    if (error) {
       console.error("Failed to add reaction:", error);
    }
  };

  const openViewOnce = async () => {
    if (isViewed || isClaiming || !msg.is_view_once) return;
    setIsClaiming(true);
    
    try {
      const res = await fetch('/api/view-once', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id })
      });
      const data = await res.json();
      
      if (data.url) {
        setViewOnceUrl(data.url);
        setIsViewingMedia(true);
      } else {
        alert(data.error || 'فشلت عملية فتح الوسائط');
      }
    } catch (err) {
      alert('حدث خطأ');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isDeleted) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-cyan-900/50 text-cyan-200' : 'bg-slate-800/50 text-slate-400'} border border-dashed border-slate-700 text-[13px] italic flex items-center gap-2`}>
           🚫 تم حذف هذه الرسالة
        </div>
      </div>
    );
  }

  // Hide if expired
  if (msg.expires_at && new Date(msg.expires_at).getTime() < Date.now()) {
    return null;
  }

  if (msg.media_type === 'system_join' || msg.media_type === 'system_leave' || (msg.media_type === 'system' && msg.content.includes('أضاف'))) {
    const isJoin = msg.media_type === 'system_join' || msg.content.includes('أضاف') || msg.content.includes('أنشأ');
    const parts = msg.content.split('|');
    const textPart = parts[0];
    const roomName = parts[1] || roomInfo?.name || 'الغرفة';
    return (
      <div className="flex justify-start mb-3 w-full my-2 px-2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[13px] font-bold shadow-sm ${isJoin ? 'bg-amber-500/10 text-amber-200 border-amber-500/20' : 'bg-slate-800/60 text-slate-400 border-slate-700/50'}`}>
           <span>{isJoin ? 'هذا المستخدم دخل الى' : 'هذا المستخدم قد غادر'}</span>
           <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-bold text-amber-100">{roomName}</span>
        </div>
      </div>
    );
  }

  if (msg.media_type === 'bot_announcement') {
    const parts = msg.content.split('|');
    const title = parts.length > 1 ? parts[0] : 'إعلان';
    const body = parts.length > 1 ? parts[1] : parts[0];
    return (
      <div className="flex justify-start mb-3 w-full my-2">
        <div className="flex items-start gap-2 w-full max-w-[85%] sm:max-w-[320px]">
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
             <span className="font-bold text-black text-xs">BOT</span>
          </div>
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl rounded-tr-sm p-3 shadow-sm w-full">
            <h4 className="text-red-500 font-bold text-[14px] mb-1">{title}</h4>
            <p className="text-sky-100 text-[14px] leading-snug">{body}</p>
          </div>
        </div>
      </div>
    );
  }

  if (msg.media_type === 'system') {
    return (
      <div className="flex justify-center mb-3 w-full my-4">
        <div className="px-4 py-1.5 rounded-full bg-slate-800/60 text-slate-400 text-[12px] font-bold shadow-sm border border-slate-700/50">
           {msg.content}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative mb-3 w-full`}>
        <div className="flex w-full max-w-[75%] sm:max-w-[280px] items-end gap-2">
          <div className={`flex flex-col relative group/bubble ${isMe ? 'items-end' : 'items-start'} w-full`}>
            {!isMe && roomInfo?.is_group && showAvatar && (
              <span className="text-[13px] text-cyan-500 mr-1 mb-1 font-bold" dir="ltr">
                {msg.sender?.full_name || msg.sender?.username}
              </span>
            )}
            
            <div 
              ref={messageRef}
              onMouseDown={handleStart}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchEnd={handleEnd}
              onTouchMove={handleMove}
              onContextMenu={(e) => { e.preventDefault(); handleStart(e as any); }}
              className={`px-3.5 py-2 rounded-2xl ${isMe ? 'bg-[#1e1d2b] text-white rounded-br-sm' : 'bg-[#13121c] text-white rounded-bl-sm'} shadow-sm relative cursor-pointer w-fit active:scale-[0.98] transition-all duration-200`}
            >
              
              {/* Reply Preview inside Bubble */}
              {msg.reply_to && (
                <div className="bg-white/5 border-r-2 border-pink-500 rounded-lg p-2 mb-1.5 text-xs flex flex-col gap-0.5 cursor-pointer hover:bg-white/10 transition-all text-right">
                  <span className="font-bold text-pink-400 text-[11px]">{msg.reply_to.sender?.username || msg.reply_to.sender?.full_name || 'مستخدم'}</span>
                  <span className="text-gray-300 line-clamp-1 text-[11px]">{msg.reply_to.content || 'رسالة...'}</span>
                </div>
              )}

              {msg.is_view_once ? (
                <div 
                  onClick={openViewOnce}
                  className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl cursor-pointer hover:bg-black/30 transition-colors"
                >
                   {isViewed ? (
                     <><Check size={16} className="text-slate-400"/><span className="text-slate-400 text-[13px]">تمت المشاهدة</span></>
                   ) : (
                     <><Eye size={16} className="text-white animate-pulse"/><span className="text-white text-[13px] font-bold">مشاهدة مرة واحدة</span></>
                   )}
                </div>
              ) : msg.media_url ? (
                <div className="mb-1">
                  {msg.media_url.endsWith('.webm') ? (
                    <audio src={msg.media_url} controls className="h-10 w-[200px]" />
                  ) : msg.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                    <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-[250px]" />
                  ) : (
                    <img src={msg.media_url} className="max-w-full rounded-xl max-h-[250px] object-cover" />
                  )}
                </div>
              ) : null}

              {msg.content && (
                <p className={`text-[14px] leading-snug font-normal break-words text-white`}>
                  {msg.content}
                </p>
              )}
              
              <div className="flex items-center justify-end gap-1 text-[10px] opacity-60 mt-0.5 select-none text-white">
                <span dir="ltr">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && <CheckCheck size={12} className="text-white" />}
              </div>

              {/* Reactions display */}
              {msg.message_reactions && msg.message_reactions.length > 0 && (
                <div className={`absolute -bottom-2.5 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center justify-center gap-1 bg-[#182229] border border-white/10 rounded-full px-2 py-0.5 shadow-lg`}>
                  {Array.from(new Set(msg.message_reactions.map((r: any) => r.reaction))).map((reaction: any, i) => (
                    <span key={i} className="text-[12px] leading-none">{reaction}</span>
                  ))}
                  {msg.message_reactions.length > 1 && <span className="text-gray-300 font-bold ml-0.5 text-[11px] leading-none">{msg.message_reactions.length}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Context Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeMenu} />
          
          <div className="flex flex-col w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 z-50" onClick={e => e.stopPropagation()}>
            
            {/* 1. Quick Emoji Reaction Bar & WhatsApp Grid */}
            <div className="flex flex-col items-center z-50 self-center mb-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 bg-[#1f1d2b] border border-white/10 rounded-full px-3 py-1.5 shadow-xl w-fit">
                <button 
                  onClick={() => setShowFullPicker(!showFullPicker)}
                  className={`w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-full transition-colors shrink-0 ${showFullPicker ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <ChevronDown size={18} className={`transition-transform ${showFullPicker ? 'rotate-180' : ''}`} />
                </button>
                <div className="w-px h-6 bg-white/10 mx-0.5"></div>
                {['🙏', '😢', '😮', '😂', '❤️', '👍'].map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => addReaction(emoji)} 
                    className="text-xl cursor-pointer hover:scale-125 transition-transform active:scale-95 flex items-center justify-center w-8 h-8"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-px h-6 bg-white/10 mx-0.5"></div>
                <button onClick={closeMenu} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shrink-0">
                  <X size={16} />
                </button>
              </div>

              {/* WhatsApp Grid Dropdown */}
              {showFullPicker && (
                <div className="grid grid-cols-6 gap-2 p-3 bg-[#181824] border border-white/10 rounded-2xl shadow-2xl z-50 mt-2 animate-in slide-in-from-top-2">
                  {['😂', '😮', '😢', '🙏', '❤️', '👍', '🔥', '👏', '🎉', '💯', '🥳', '🤩', '😡', '🤔', '💩', '🤝', '✨', '⚡'].map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => addReaction(emoji)} 
                      className="text-2xl cursor-pointer hover:scale-125 transition-transform active:scale-95 flex items-center justify-center w-9 h-9"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Message Preview */}
            <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'} z-50 relative scale-[1.02] transition-transform mb-2`}>
              <div className={`px-3.5 py-2 rounded-2xl ${isMe ? 'bg-[#1e1d2b] text-white rounded-br-sm' : 'bg-[#13121c] text-white rounded-bl-sm'} shadow-2xl relative break-words text-right max-w-[85%]`}>
                {msg.reply_to && (
                  <div className="bg-white/5 border-r-2 border-pink-500 rounded-lg p-2 mb-1.5 text-xs flex flex-col gap-0.5 text-right">
                    <span className="font-bold text-pink-400 text-[11px]">{msg.reply_to.sender?.username || msg.reply_to.sender?.full_name || 'مستخدم'}</span>
                    <span className="text-gray-300 line-clamp-1 text-[11px]">{msg.reply_to.content || 'رسالة...'}</span>
                  </div>
                )}
                {msg.is_view_once ? (
                  <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl">
                    <Eye size={16} className="text-white"/><span className="text-white text-[13px] font-bold">مشاهدة مرة واحدة</span>
                  </div>
                ) : msg.media_url ? (
                  <div className="mb-1">
                    {msg.media_url.endsWith('.webm') ? (
                      <audio src={msg.media_url} controls className="h-10 w-[200px]" />
                    ) : msg.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                      <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-[150px]" />
                    ) : (
                      <img src={msg.media_url} className="max-w-full rounded-xl max-h-[150px] object-cover" />
                    )}
                  </div>
                ) : null}
                {msg.content && (
                  <p className={`text-[14px] leading-snug font-normal break-words text-white`}>
                    {msg.content}
                  </p>
                )}
                <div className="flex items-center justify-end gap-1 text-[10px] opacity-60 mt-0.5 select-none text-white">
                  <span dir="ltr">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <CheckCheck size={12} className="text-white" />}
                </div>
              </div>
            </div>

            {/* 3. Action List */}
            <div className={`bg-[#181824] border border-white/10 rounded-2xl p-2 w-60 shadow-2xl z-50 flex flex-col gap-1 text-right ${isMe ? 'self-end' : 'self-start'}`}>
              <button onClick={() => { if(onReply) onReply(msg); setShowMenu(false); }} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5 flex items-center justify-between text-slate-200 font-medium">
                <span>رد</span> <Reply size={16} className="text-slate-400" />
              </button>
              <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); setShowMenu(false); }} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5 flex items-center justify-between text-slate-200 font-medium">
                <span>نسخ</span> <Copy size={16} className="text-slate-400" />
              </button>
              <button onClick={() => { setShowMenu(false); }} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5 flex items-center justify-between text-slate-200 font-medium">
                <span>تثبيت</span> <Pin size={16} className="text-slate-400" />
              </button>
              <button onClick={() => { setShowMenu(false); }} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5 flex items-center justify-between text-slate-200 font-medium">
                <span>تحويل</span> <Forward size={16} className="text-slate-400" />
              </button>
              
              <div className="h-px bg-white/5 my-0.5 mx-2"></div>
              
              <button onClick={deleteForMe} className="px-3 py-2 text-sm rounded-xl hover:bg-white/5 flex items-center justify-between text-red-400 font-medium">
                <span>حذف لدي فقط</span> <Trash2 size={16} />
              </button>
              
              {isMe && (
                <button onClick={deleteForEveryone} className="px-3 py-2 text-sm rounded-xl hover:bg-red-500/10 flex items-center justify-between text-red-500 font-bold">
                  <span>حذف لدى الجميع</span> <Trash2 size={16} />
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* View Once Fullscreen Viewer */}
      {isViewingMedia && viewOnceUrl && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col">
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 w-full z-10">
             <button onClick={() => { setIsViewingMedia(false); setViewOnceUrl(null); }} className="p-2 text-white bg-slate-800/50 rounded-full hover:bg-slate-700">
               ✕ إغلاق
             </button>
             <div className="text-white font-bold flex items-center gap-2"><Eye size={18}/> عرض لمرة واحدة</div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
             {viewOnceUrl.match(/\.(mp4|mov|webm)$/i) ? (
                <video src={viewOnceUrl} autoPlay controls className="max-w-full max-h-full rounded-xl" />
             ) : (
                <img src={viewOnceUrl} className="max-w-full max-h-full object-contain rounded-xl" />
             )}
          </div>
        </div>
      )}
    </>
  );
}
