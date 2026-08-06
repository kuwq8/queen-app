'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Repeat, Heart, Share, MoreHorizontal, Edit, Trash2, Bookmark } from 'lucide-react';

interface PostItemProps {
  post: any;
  currentUsername: string;
  onPostDeleted: (postId: string) => void;
  onPostEdited: (postId: string, newContent: string) => void;
}

export default function PostItem({ post: initialPost, currentUsername, onPostDeleted, onPostEdited }: PostItemProps) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialPost.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReposted, setIsReposted] = useState(false);

  const isLiked = false; // TODO: Implement likes in Supabase
  const isBookmarked = false; // TODO: Implement bookmarks in Supabase
  
  const isEdited = false; // TODO: Implement updated_at

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'الآن';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  };

  const isOwner = currentUsername === post.author?.username;

  const handleEdit = async () => {
    if (editContent.trim() === '' || editContent === post.content) {
      setIsEditing(false);
      return;
    }
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent })
        .eq('id', post.id);

      if (!error) {
        onPostEdited(post.id, editContent);
        setPost((prev: any) => ({ ...prev, content: editContent }));
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (!error) {
        onPostDeleted(post.id);
      } else {
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement Like functionality in Supabase (requires 'likes' table)
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement Bookmark functionality in Supabase (requires 'bookmarks' table)
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`http://localhost:3000/post/${post.id}`);
    alert('تم نسخ الرابط!');
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement Repost functionality in Supabase
  };

  return (
    <div className="p-4 border-b border-slate-800 hover:bg-[#111] transition-colors relative flex gap-3 text-right">
      {/* Clickable Area for routing (excludes dropdown/buttons) */}
      <div 
        className="absolute inset-0 cursor-pointer z-0" 
        onClick={() => router.push(`/${post.author.username}`)}
      />

      <Link href={`/${post.author.username}`} className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-base border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors z-10 relative overflow-hidden">
        {post.author?.avatar_url ? (
          <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
        ) : (
          <span dir="ltr">{post.author.username.charAt(0).toUpperCase()}</span>
        )}
      </Link>
      
      <div className="flex-1 min-w-0 z-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span 
              onClick={(e) => { e.stopPropagation(); router.push(`/${post.author.username}`); }}
              className="font-bold text-white text-[15px] hover:underline cursor-pointer"
              dir="ltr"
            >
              {post.author.username}
            </span>
            <span className="text-slate-500 text-[15px]" dir="ltr">@{post.author.username}</span>
            <span className="text-slate-500 text-[15px]">·</span>
            <span className="text-slate-500 text-[14px]">{formatTime(post.createdAt)}</span>
            {isEdited && <span className="text-slate-500 text-[11px] italic bg-slate-800/50 px-1.5 py-0.5 rounded-full mr-1">معدلة</span>}
          </div>
          
          {isOwner && (
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }} 
                className="text-slate-500 hover:text-cyan-500 p-1 rounded-full hover:bg-cyan-500/10 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>
              
              {showDropdown && (
                <div className="absolute left-0 top-8 w-40 bg-black border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowDropdown(false); }}
                    className="w-full text-right px-4 py-2 text-white hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Edit size={16} className="text-slate-400" /> تعديل
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(); setShowDropdown(false); }}
                    disabled={isDeleting}
                    className="w-full text-right px-4 py-2 text-red-500 hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} className="text-red-500" /> {isDeleting ? 'جاري الحذف...' : 'حذف'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <textarea
              className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none text-[15px]"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => { setIsEditing(false); setEditContent(post.content); }} className="px-4 py-1.5 rounded-full text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                إلغاء
              </button>
              <button onClick={handleEdit} className="px-4 py-1.5 rounded-full text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white transition-colors">
                حفظ
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.content && (
              <p className="mt-1 text-slate-200 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>
            )}

            {post.mediaUrl && (
              <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-800/50">
                <img src={post.mediaUrl} alt="Post media" className="w-full max-h-[500px] object-cover" />
              </div>
            )}

            {post.quotePost && (
              <div 
                className="mt-3 border border-slate-700 rounded-xl p-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); router.push(`/post/${post.quotePost.id}`); }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-800 overflow-hidden">
                    {post.quotePost.author?.avatar_url ? (
                      <img src={post.quotePost.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full text-[10px] font-bold" dir="ltr">{post.quotePost.author?.username?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-bold text-white text-[13px]" dir="ltr">{post.quotePost.author?.username}</span>
                  <span className="text-slate-500 text-[13px]" dir="ltr">@{post.quotePost.author?.username}</span>
                </div>
                <p className="mt-1 text-slate-200 text-[14px]">{post.quotePost.content}</p>
                {post.quotePost.mediaUrl && (
                   <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-800/50">
                     <img src={post.quotePost.mediaUrl} alt="Quoted media" className="w-full max-h-[200px] object-cover" />
                   </div>
                )}
              </div>
            )}
          </>
        )}
        
        <div className="flex justify-between items-center text-slate-500 mt-2 max-w-md relative z-10" dir="ltr">
          <button 
            onClick={(e) => { e.stopPropagation(); router.push(`/post/${post.id}`); }}
            className="flex items-center gap-2 hover:text-cyan-500 transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors"><MessageCircle size={18} /></div>
            <span className="text-sm">{post._count?.comments || 0}</span>
          </button>
          
          <button 
            onClick={handleRepost}
            className={`flex items-center gap-2 hover:text-green-500 transition-colors group ${isReposted ? 'text-green-500' : ''}`}
          >
            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
              <Repeat size={18} />
            </div>
            <span className="text-sm">{post._count?.quotedBy || 0}</span>
          </button>

          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 hover:text-red-500 transition-colors group ${isLiked ? 'text-red-500' : ''}`}
          >
            <div className="p-2 rounded-full group-hover:bg-red-500/10 transition-colors">
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
            </div>
            <span className="text-sm">{post._count?.likes || 0}</span>
          </button>

          <button 
            onClick={handleBookmark}
            className={`flex items-center gap-2 hover:text-cyan-500 transition-colors group ${isBookmarked ? 'text-cyan-500' : ''}`}
          >
            <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors">
              <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
            </div>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-2 hover:text-cyan-500 transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors"><Share size={18} /></div>
          </button>
        </div>
      </div>
    </div>
  );
}
