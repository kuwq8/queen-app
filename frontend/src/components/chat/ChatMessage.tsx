import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Forward, Eye, Check, Reply, Clock, Pin, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ChatMessageProps {
  msg: any;
  isMe: boolean;
  showAvatar: boolean;
  currentUserId: string;
  roomInfo: any;
  onEdit: () => void;
}

export default function ChatMessage({ msg, isMe, showAvatar, currentUserId, roomInfo, onEdit }: ChatMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
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
         setShowMenu(true);
      }
    }, 500);
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
    const supabase = createClient();
    await supabase.from('message_reactions').insert({ message_id: msg.id, user_id: currentUserId, reaction });
    setShowMenu(false);
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

  return (
    <>
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative mb-3`}>
        <div className="flex max-w-[85%] items-end gap-2">
          {/* Show Avatar only for received messages (if showAvatar is true). Never show for my own messages. */}
          {!isMe && showAvatar ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-700 mt-auto">
              {msg.sender?.avatar_url ? (
                <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[14px] font-bold text-slate-300" dir="ltr">
                  {msg.sender?.username?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
          ) : !isMe ? (
            <div className="w-8 h-8 flex-shrink-0" />
          ) : null}

          <div className={`flex flex-col relative group/bubble ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
            {showAvatar && (
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
              className={`px-3 py-2 rounded-2xl ${isMe ? 'bg-cyan-600 rounded-bl-sm' : 'bg-slate-800 rounded-br-sm'} shadow-sm relative cursor-pointer active:scale-[0.98] transition-all duration-200 ${showMenu ? 'z-[105] scale-[1.02] shadow-2xl ring-2 ring-cyan-500/50' : ''}`}
            >
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
                <p className={`text-[14px] leading-relaxed break-words ${isMe ? 'text-white' : 'text-slate-100'}`}>
                  {msg.content}
                </p>
              )}

              {/* Reactions display */}
              {msg.message_reactions && msg.message_reactions.length > 0 && (
                <div className={`absolute -bottom-3 ${isMe ? 'left-2' : 'right-2'} bg-slate-900 border border-slate-700 rounded-full px-1.5 py-0.5 text-[11px] flex items-center gap-1 shadow-md z-10`}>
                  {Array.from(new Set(msg.message_reactions.map((r: any) => r.reaction))).map((reaction: any, i) => (
                    <span key={i} className="text-[14px]">{reaction}</span>
                  ))}
                  {msg.message_reactions.length > 1 && <span className="text-slate-400 ml-1 font-bold">{msg.message_reactions.length}</span>}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] text-slate-500 font-medium">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.expires_at && <Clock size={10} className="text-cyan-600 opacity-70" title="رسالة مؤقتة"/>}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Context Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4" onClick={() => setShowMenu(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0" />
          
          <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 z-10" onClick={e => e.stopPropagation()}>
            
            {/* 1. Emoji Bar */}
            <div className="flex items-center justify-center gap-2 bg-[#1e1e2e] p-2.5 rounded-full border border-white/10 shadow-xl w-full">
              {['❤️', '👍', '👎', '🔥', '🥰', '👏', '😄'].map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => addReaction(emoji)} 
                  className="text-[22px] hover:scale-125 transition-transform active:scale-95 w-9 h-9 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* 2. Message Preview */}
            <div className={`w-full flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] bg-[#2a2a3c] p-3 rounded-2xl text-white shadow-lg relative break-words text-right">
                {msg.media_url ? (
                  <div className="mb-2">
                    {msg.media_url.endsWith('.webm') ? (
                      <audio src={msg.media_url} controls className="h-10 w-[200px]" />
                    ) : msg.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                      <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-[150px]" />
                    ) : (
                      <img src={msg.media_url} className="max-w-full rounded-xl max-h-[150px] object-cover" />
                    )}
                  </div>
                ) : null}
                <p className="text-[14.5px] leading-relaxed break-words">{msg.content || 'رسالة...'}</p>
              </div>
            </div>

            {/* 3. Action List */}
            <div className="w-56 bg-[#181824] p-2 rounded-2xl border border-white/10 shadow-2xl flex flex-col text-right">
              <button onClick={() => { alert('ميزة الرد قيد التطوير'); setShowMenu(false); }} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-slate-200 text-[14px] font-medium">
                <Reply size={18} className="text-slate-400" /> رد
              </button>
              <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); alert('تم النسخ!'); setShowMenu(false); }} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-slate-200 text-[14px] font-medium">
                <Copy size={18} className="text-slate-400" /> نسخ
              </button>
              <button onClick={() => { alert('ميزة التثبيت قيد التطوير'); setShowMenu(false); }} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-slate-200 text-[14px] font-medium">
                <Pin size={18} className="text-slate-400" /> تثبيت
              </button>
              <button onClick={() => { alert('ميزة التحويل قيد التطوير'); setShowMenu(false); }} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-slate-200 text-[14px] font-medium">
                <Forward size={18} className="text-slate-400" /> تحويل
              </button>
              
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              
              <button onClick={deleteForMe} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-red-400/90 text-[14px] font-medium">
                <Trash2 size={18} /> حذف لدي فقط
              </button>
              
              {isMe && (
                <button onClick={deleteForEveryone} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-red-500/10 rounded-xl transition-colors text-red-500 text-[14px] font-bold">
                  <Trash2 size={18} /> حذف لدى الجميع
                </button>
              )}
              
              <div className="h-px bg-white/5 my-1 mx-2"></div>
              
              <button onClick={() => { alert('ميزة التحديد قيد التطوير'); setShowMenu(false); }} className="w-full text-right px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 rounded-xl transition-colors text-slate-200 text-[14px] font-medium">
                <CheckCircle size={18} className="text-slate-400" /> تحديد
              </button>
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
