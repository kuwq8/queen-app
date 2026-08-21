"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash2, Smile } from 'lucide-react';

interface ChannelPostBubbleProps {
  post: any;
  currentUserId: string;
  onPostDeleted?: (id: string) => void;
}

export default function ChannelPostBubble({ post, currentUserId, onPostDeleted }: ChannelPostBubbleProps) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc: any, r: any) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, me: false };
    acc[r.emoji].count += 1;
    if (r.user_id === currentUserId) acc[r.emoji].me = true;
    return acc;
  }, {});

  useEffect(() => {
    fetchReactions();
    
    // Setup Realtime for reactions on this post
    let channel: any;
    const setupRealtime = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      channel = supabase.channel(`post_reactions_${post.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${post.id}` }, () => {
          fetchReactions();
        })
        .subscribe();
    };
    setupRealtime();

    return () => {
      if (channel) channel.unsubscribe();
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

  const handleToggleReaction = async (emoji: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const existing = reactions.find(r => r.user_id === currentUserId && r.emoji === emoji);
      
      if (existing) {
        // Remove
        await supabase.from('post_reactions').delete().eq('id', existing.id);
      } else {
        // Add
        await supabase.from('post_reactions').insert({ post_id: post.id, user_id: currentUserId, emoji });
      }
      setShowEmojiPicker(false);
    } catch (e) {
      console.error(e);
    }
  };

  const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const timeString = format(new Date(post.created_at), 'h:mm a', { locale: ar });

  return (
    <div className="w-full flex justify-start mb-4 px-2">
      <div className="max-w-[90%] sm:max-w-[80%] bg-[#202c33] rounded-2xl rounded-tr-none p-3 relative shadow-sm group">
        
        {currentUserId === post.user_id && (
          <button 
            onClick={async () => {
              if(!confirm('حذف؟')) return;
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.from('posts').delete().eq('id', post.id);
              if (onPostDeleted) onPostDeleted(post.id);
            }}
            className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Post content */}
        <div className="text-white text-[15px] whitespace-pre-wrap leading-relaxed pb-4">
          {post.content}
        </div>
        
        {/* Media (if any) */}
        {post.media_url && (
          <div className="mt-2 mb-4 rounded-xl overflow-hidden">
            {post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={post.media_url} controls className="w-full max-h-80 object-cover" />
            ) : (
              <img src={post.media_url} alt="Media" className="w-full max-h-80 object-cover" />
            )}
          </div>
        )}

        {/* Time */}
        <div className="absolute bottom-1.5 left-3 text-[11px] text-slate-400">
          {timeString}
        </div>

        {/* Reactions Display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="absolute -bottom-3 right-3 flex gap-1">
            {Object.entries(groupedReactions).map(([emoji, data]: [string, any]) => (
              <button 
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] shadow-sm border ${
                  data.me ? 'bg-sky-900/40 border-sky-500/50 text-sky-200' : 'bg-[#182229] border-slate-700 text-slate-300'
                }`}
              >
                <span>{emoji}</span>
                {data.count > 1 && <span>{data.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Emoji Picker Trigger (appears on hover) */}
        <div className="absolute -right-8 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-full bg-[#202c33] text-slate-400 hover:text-white border border-slate-700 shadow-md"
            >
              <Smile size={18} />
            </button>
            
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-[#2a3942] border border-slate-700 rounded-full py-2 px-3 flex gap-2 shadow-xl z-50">
                {availableEmojis.map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
