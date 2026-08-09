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

  const formattedTime = new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const handleDelete = async () => {
    if (confirm('هل تريد بالتأكيد حذف هذه الرسالة؟')) {
      const supabase = createClient();
      await supabase.from('messages').update({ is_deleted: true, deleted_by: currentUserId, deleted_at: new Date().toISOString() }).eq('id', msg.id);
    }
  };

  return (
    <div className={`flex w-full group py-2 px-3 border-b border-gray-300/60 bg-[#fcfcfc] hover:bg-black/5 transition-colors ${msg.is_view_once ? 'opacity-80' : ''}`}>
      <div className="flex w-full gap-2 items-start relative">
        {/* Avatar */}
        <div className="w-10 h-10 shrink-0 overflow-hidden rounded shadow-sm border border-gray-300 bg-white flex justify-center items-center">
          {msg.sender?.avatar_url ? (
            <img src={msg.sender.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <span className="font-bold text-gray-500 text-lg">
               {msg.sender?.username?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex justify-between items-center w-full">
            <span className="text-blue-700 font-bold text-[14px] truncate">
              {msg.sender?.full_name || msg.sender?.username || 'مستخدم'}
            </span>
            
            {/* Action Buttons on Left */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onReply && onReply(msg)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded text-[10px] font-bold h-6 w-6 flex items-center justify-center transition-colors shadow-sm"
                title="رد"
              >
                ↩
              </button>
              {isMe && (
                <button 
                  onClick={handleDelete}
                  className="bg-gray-200 hover:bg-red-200 text-gray-700 hover:text-red-600 p-1 rounded text-[10px] font-bold h-6 w-6 flex items-center justify-center transition-colors shadow-sm"
                  title="حذف"
                >
                  X
                </button>
              )}
            </div>
          </div>

          <div className="text-gray-900 text-[14px] mt-0.5 whitespace-pre-wrap break-words leading-relaxed font-medium">
            {msg.reply_to && (
              <div className="text-[11px] text-gray-600 bg-black/5 p-1 rounded border-r-2 border-blue-500 mb-1 truncate">
                الرد على {msg.reply_to.sender?.username}: {msg.reply_to.content}
              </div>
            )}
            
            {msg.media_url ? (
               msg.is_view_once ? (
                 <button onClick={openViewOnce} className="flex items-center gap-2 bg-blue-500/10 text-blue-600 px-3 py-2 rounded-lg text-xs font-bold border border-blue-500/20 w-fit">
                    <Eye size={14} /> شاهد المرفق
                 </button>
               ) : (
                 <img src={msg.media_url} className="rounded-lg mt-1 max-w-[200px] h-auto border border-gray-300 shadow-sm" alt="media" />
               )
            ) : (
              msg.content
            )}
          </div>
        </div>
      </div>
      
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
    </div>
  );
}
