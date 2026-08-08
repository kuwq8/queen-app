import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Heart, Copy, Bookmark, Forward, Info, Eye, Play, Check, Reply, Clock } from 'lucide-react';
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
  const [isViewingMedia, setIsViewingMedia] = useState(false);
  const [viewOnceUrl, setViewOnceUrl] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if media is viewed
  const isViewed = msg.message_viewers?.some((v: any) => v.user_id === currentUserId);
  const isDeleted = msg.is_deleted;

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const deleteForMe = async () => {
    const supabase = createClient();
    await supabase.from('message_deletions').insert({ message_id: msg.id, user_id: currentUserId });
    setShowMenu(false);
  };

  const deleteForEveryone = async () => {
    const supabase = createClient();
    await supabase.from('messages').update({ is_deleted: true, deleted_by: currentUserId, deleted_at: new Date().toISOString() }).eq('id', msg.id);
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
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`p-3 rounded-2xl ${isMe ? 'bg-cyan-900/50 text-cyan-200' : 'bg-slate-800/50 text-slate-400'} border border-dashed border-slate-700 text-[13px] italic flex items-center gap-2`}>
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
      <div 
        className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative mb-4`}
      >
        <div className="flex max-w-[85%] items-end gap-2">
          {!isMe && (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {showAvatar ? (
                msg.sender?.avatar_url ? (
                  <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold" dir="ltr">{msg.sender?.username?.charAt(0).toUpperCase() || '?'}</span>
                )
              ) : null}
            </div>
          )}

          <div className={`flex flex-col relative group/bubble ${isMe ? 'items-end' : 'items-start'}`}>
            {!isMe && showAvatar && roomInfo?.is_group && <span className="text-xs text-slate-500 mr-1 mb-1 font-bold" dir="ltr">{msg.sender?.username}</span>}
            
            <div 
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); }}
              className={`p-3 rounded-2xl ${isMe ? 'bg-cyan-600 rounded-bl-sm' : 'bg-slate-800 rounded-br-sm'} shadow-sm relative cursor-pointer active:scale-[0.98] transition-transform`}
            >
              {msg.is_view_once ? (
                <div 
                  onClick={openViewOnce}
                  className="flex items-center gap-2 bg-black/20 p-3 rounded-xl cursor-pointer hover:bg-black/30 transition-colors"
                >
                   {isViewed ? (
                     <><Check size={18} className="text-slate-400"/><span className="text-slate-400 text-sm">تمت المشاهدة</span></>
                   ) : (
                     <><Eye size={18} className="text-white animate-pulse"/><span className="text-white text-sm font-bold">مشاهدة مرة واحدة</span></>
                   )}
                </div>
              ) : msg.media_url ? (
                <div className="mb-2">
                  {msg.media_url.endsWith('.webm') ? (
                    <audio src={msg.media_url} controls className="h-10 w-[200px]" />
                  ) : msg.media_url.match(/\.(mp4|mov|webm)$/i) ? (
                    <video src={msg.media_url} controls className="max-w-full rounded-xl max-h-[300px]" />
                  ) : (
                    <img src={msg.media_url} className="max-w-full rounded-xl max-h-[300px] object-cover" />
                  )}
                </div>
              ) : null}

              {msg.content && (
                <p className={`text-[15px] leading-relaxed break-words ${isMe ? 'text-white' : 'text-slate-200'}`}>
                  {msg.content}
                </p>
              )}

              {/* Reactions display */}
              {msg.message_reactions && msg.message_reactions.length > 0 && (
                <div className={`absolute -bottom-3 ${isMe ? 'left-2' : 'right-2'} bg-slate-900 border border-slate-700 rounded-full px-2 py-0.5 text-xs flex gap-1 shadow-lg z-10`}>
                  {Array.from(new Set(msg.message_reactions.map((r: any) => r.reaction))).map((reaction: any, i) => (
                    <span key={i}>{reaction}</span>
                  ))}
                  {msg.message_reactions.length > 1 && <span className="text-slate-400 ml-1">{msg.message_reactions.length}</span>}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {msg.expires_at && <Clock size={10} className="text-cyan-500" title="رسالة مؤقتة"/>}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu / Bottom Sheet */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4" onClick={() => setShowMenu(false)}>
          <div 
            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-center gap-4 text-2xl">
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                <button key={emoji} onClick={() => addReaction(emoji)} className="hover:scale-125 transition-transform active:scale-95">{emoji}</button>
              ))}
            </div>
            
            <div className="p-2 flex flex-col text-right">
              <button onClick={() => { setShowMenu(false); }} className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-slate-300">
                <Reply size={18} /> رد
              </button>
              <button onClick={() => { navigator.clipboard.writeText(msg.content); setShowMenu(false); }} className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-slate-300">
                <Copy size={18} /> نسخ
              </button>
              <button onClick={() => { setShowMenu(false); }} className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-slate-300">
                <Forward size={18} /> إعادة توجيه
              </button>
              
              <div className="h-px bg-slate-800 my-1"></div>
              
              <button onClick={deleteForMe} className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-red-400">
                <Trash2 size={18} /> حذف لدي فقط
              </button>
              
              {isMe && (
                <button onClick={deleteForEveryone} className="w-full text-right px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors text-red-500 font-bold">
                  <Trash2 size={18} /> حذف لدى الجميع
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
