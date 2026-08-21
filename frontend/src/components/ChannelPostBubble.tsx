"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Smile, Repeat } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface ChannelPostBubbleProps {
  post: any;
  currentUserId: string;
  onPostDeleted?: (id: string) => void;
}

export default function ChannelPostBubble({ post, currentUserId, onPostDeleted }: ChannelPostBubbleProps) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: any, r: any) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, me: false };
    acc[r.emoji].count += 1;
    if (r.user_id === currentUserId) acc[r.emoji].me = true;
    return acc;
  }, {});

  const totalReactions = reactions.length;
  // Get top 3 unique emojis for the summary pill
  const topEmojis = Object.entries(groupedReactions)
    .sort((a: any, b: any) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(e => e[0]);

  const hasReposted = reposts.some(r => r.user_id === currentUserId);
  const repostCount = reposts.length;

  useEffect(() => {
    fetchReactions();
    fetchReposts();
    
    let channelReactions: any;
    let channelReposts: any;
    
    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      channelReactions = supabase.channel(`post_reactions_${post.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` }, () => {
          fetchReactions();
        })
        .subscribe();
        
      channelReposts = supabase.channel(`post_reposts_${post.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reposts', filter: `post_id=eq.${post.id}` }, () => {
          fetchReposts();
        })
        .subscribe();
    };
    
    setupRealtime();

    return () => {
      if (channelReactions) channelReactions.unsubscribe();
      if (channelReposts) channelReposts.unsubscribe();
    };
  }, [post.id]);

  const fetchReactions = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('post_reactions').select('*').eq('post_id', post.id);
      if (data) setReactions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReposts = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('reposts').select('*').eq('post_id', post.id);
      if (data) setReposts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const existing = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji);
      
      if (existing) {
        await supabase.from('post_reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUserId, emoji });
      }
      setShowEmojiPicker(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRepost = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      if (hasReposted) {
        const existing = reposts.find(r => r.user_id === currentUserId);
        if (existing) {
          await supabase.from('reposts').delete().eq('id', existing.id);
        }
      } else {
        await supabase.from('reposts').insert({ post_id: post.id, user_id: currentUserId });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const timeString = new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(post.created_at || post.createdAt));

  return (
    <div className="w-full flex justify-center mb-6 px-1 sm:px-2">
      <div className="w-[98%] sm:w-[85%] md:w-[70%] lg:w-[60%] xl:w-[55%] bg-[#202c33] rounded-2xl rounded-tr-none p-4 relative shadow-md group">
        
        {currentUserId === post.user_id && (
          <button 
            onClick={async () => {
              if(!confirm('هل أنت متأكد من حذف هذا البث؟')) return;
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.from('posts').delete().eq('id', post.id);
              if (onPostDeleted) onPostDeleted(post.id);
            }}
            className="absolute top-2 right-2 text-slate-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1.5 rounded-full"
            title="حذف البث"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Post content */}
        <div className="text-[#e9edef] text-[15px] sm:text-[16px] whitespace-pre-wrap leading-relaxed sm:leading-7 pb-6 pt-1">
          {post.content}
        </div>
        
        {/* Media (if any) */}
        {post.media_url && (
          <div className="mt-2 mb-6 rounded-xl overflow-hidden">
            {post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={post.media_url} controls className="w-full max-h-[400px] object-cover" />
            ) : (
              <img src={post.media_url} alt="Media" className="w-full max-h-[400px] object-cover" />
            )}
          </div>
        )}

        {/* Bottom row: Time */}
        <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 font-medium">
          {timeString}
        </div>

        {/* Action Pills */}
        <div className="absolute -bottom-3 right-4 flex gap-1.5 items-center z-10" ref={pickerRef}>
          
          {/* Repost Pill */}
          <div 
            onClick={handleToggleRepost}
            className={`flex items-center gap-1 bg-[#182229] border border-[#2a3942] rounded-full px-2.5 py-1 cursor-pointer hover:bg-[#202c33] shadow-sm transition-colors ${hasReposted ? 'text-green-500 border-green-500/30' : 'text-slate-400'}`}
          >
            <Repeat size={14} />
            {repostCount > 0 && <span className="text-[12px] font-bold">{repostCount}</span>}
          </div>

          {/* Reaction Pill (WhatsApp style) */}
          {totalReactions > 0 && (
            <div 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center gap-1.5 bg-[#182229] border border-[#2a3942] rounded-full px-2.5 py-1 cursor-pointer hover:bg-[#202c33] shadow-sm transition-colors"
            >
              <span className="text-slate-300 text-[12px] font-bold">{totalReactions}</span>
              <div className="flex -space-x-1 space-x-reverse">
                {topEmojis.map((emoji, idx) => (
                  <span key={idx} className="text-[13px]">{emoji}</span>
                ))}
              </div>
            </div>
          )}

          {/* Add Reaction Button */}
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex items-center justify-center bg-[#182229] border border-[#2a3942] rounded-full p-1.5 cursor-pointer hover:bg-[#202c33] shadow-sm transition-colors text-slate-400 hover:text-white"
            >
              <Smile size={15} />
            </button>
            
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-[90] sm:hidden" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}></div>
                <div className="fixed bottom-0 left-0 w-full z-[100] sm:absolute sm:bottom-full sm:left-auto sm:right-0 sm:w-auto sm:mb-2 shadow-2xl animate-in slide-in-from-bottom-10">
                  <EmojiPicker 
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData) => handleToggleReaction(emojiData.emoji)}
                    searchPlaceHolder="ابحث عن إيموجي..."
                    width="100%"
                    height={350}
                  />
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
