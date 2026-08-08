import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, Forward, Eye, Check, CheckCheck, Reply, Clock, Pin, CheckCircle, ChevronDown, Search } from 'lucide-react';
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
}

export default function ChatMessage({ msg, isMe, showAvatar, currentUserId, roomInfo, onEdit, onReact }: ChatMessageProps) {
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
              className={`px-3.5 py-2 rounded-2xl ${isMe ? 'bg-[#1d9bf0] text-white rounded-br-sm' : 'bg-[#202327] text-white rounded-bl-sm'} shadow-sm relative cursor-pointer active:scale-[0.98] transition-all duration-200 ${showMenu ? 'z-[105] scale-[1.02] shadow-2xl ring-2 ring-[#1d9bf0]/50' : ''}`}
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
                <p className={`text-[14px] leading-snug font-normal break-words text-white`}>
                  {msg.content}
                </p>
              )}
              
              <div className="flex items-center justify-end gap-1 text-[10px] opacity-80 mt-1 select-none text-white">
                <span dir="ltr">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && <CheckCheck size={13} className="text-white" />}
              </div>

              {/* Reactions display */}
              {msg.message_reactions && msg.message_reactions.length > 0 && (
                <div className={`absolute -bottom-2 ${isMe ? 'right-2' : 'left-2'} z-10 flex items-center justify-center gap-1 bg-[#15202b] border border-gray-700/60 rounded-full px-1.5 py-0.5 shadow-lg`}>
                  {Array.from(new Set(msg.message_reactions.map((r: any) => r.reaction))).map((reaction: any, i) => (
                    <span key={i} className="text-[11px] leading-none">{reaction}</span>
                  ))}
                  {msg.message_reactions.length > 1 && <span className="text-gray-300 font-bold ml-0.5 text-[10px] leading-none">{msg.message_reactions.length}</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Centered Context Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4" onClick={() => setShowMenu(false)}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0" />
          
          <div className="flex flex-col items-center gap-4 w-full max-w-sm animate-in fade-in zoom-in-95 duration-150 z-10" onClick={e => e.stopPropagation()}>
            
            {/* 1. Emoji Bar or Full Picker */}
            {showFullPicker ? (
              <div className="bg-[#181824] rounded-2xl p-1 border border-white/10 shadow-2xl w-full flex flex-col items-center">
                <EmojiPicker 
                  theme={Theme.DARK} 
                  onEmojiClick={(emojiData: EmojiClickData) => { addReaction(emojiData.emoji); setShowFullPicker(false); }}
                  width="100%"
                  height={350}
                  searchPlaceHolder="بحث..."
                />
              </div>
            ) : (
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
                <button 
                  onClick={() => setShowFullPicker(true)} 
                  className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors ml-1 text-slate-400"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            )}

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
