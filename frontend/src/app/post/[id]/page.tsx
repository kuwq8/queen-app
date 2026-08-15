'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, MessageSquareOff, ImageIcon, Sparkles } from 'lucide-react';
import PostItem from '../../../components/PostItem';
import BottomNav from '../../../components/BottomNav';

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPostAndComments();
  }, [postId, router]);

  const fetchPostAndComments = async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      // Get current user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        setCurrentUsername(profile.username || session.user.user_metadata?.full_name || 'مستخدم');
        setCurrentUserAvatar(profile.avatar_url || '');
      }

      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_user_id_fkey(id, username, avatar_url)')
        .eq('id', postId)
        .single();
        
      if (postData) {
        let finalPost = { ...postData };
        if (session) {
          const [likesRes, repostsRes, bookmarksRes] = await Promise.all([
            supabase.from('likes').select('id').eq('user_id', session.user.id).eq('post_id', postId),
            supabase.from('reposts').select('id').eq('user_id', session.user.id).eq('post_id', postId),
            supabase.from('bookmarks').select('id').eq('user_id', session.user.id).eq('post_id', postId)
          ]);
          finalPost.isLiked = (likesRes.data && likesRes.data.length > 0) || false;
          finalPost.isReposted = (repostsRes.data && repostsRes.data.length > 0) || false;
          finalPost.isBookmarked = (bookmarksRes.data && bookmarksRes.data.length > 0) || false;
        }
        setPost(finalPost);
        supabase.rpc('increment_post_views', { post_id_val: postId }).catch(console.error);
      }

      // Fetch comments (if table exists)
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_user_id_fkey(id, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (commentsData) {
        setComments(commentsData);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    setIsSubmitting(true);
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          content: commentContent
        })
        .select('*, author:profiles!comments_user_id_fkey(id, username, avatar_url)')
        .single();
        
      if (newComment) {
        setComments([newComment, ...comments]);
        setCommentContent('');
        setPost((prev: any) => ({
          ...prev,
          comments_count: (prev.comments_count || 0) + 1
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostDeleted = () => {
    router.back();
  };

  const handlePostEdited = (id: string, newContent: string) => {
    setPost((prev: any) => ({ ...prev, content: newContent }));
  };

  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500">جاري التحميل...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-xl font-bold mb-4">المنشور غير موجود</h1>
        <button onClick={() => router.back()} className="text-cyan-500 hover:underline">العودة للخلف</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-black">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black pb-[60px]" dir="rtl">
        
        {/* Expanded Image Modal */}
        {expandedImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
            onClick={() => setExpandedImage(null)}
          >
            <button className="absolute top-4 left-4 text-white hover:text-red-500 p-2">✕ إغلاق</button>
            <img src={expandedImage} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" alt="Expanded media" />
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md flex items-center px-4 py-3 space-x-6 space-x-reverse border-b border-slate-800/50">
          <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">المنشور</h2>
        </header>

        {/* The Post */}
        <div className="border-b border-slate-800/50">
          <PostItem 
            post={post} 
            currentUsername={currentUsername} 
            onPostDeleted={handlePostDeleted} 
            onPostEdited={handlePostEdited} 
          />
        </div>

        {/* Comment Input */}
        {post.is_comments_disabled ? (
          <div className="p-4 border-b border-slate-800 bg-[#111] flex items-center justify-center gap-2">
            <MessageSquareOff size={18} className="text-slate-500" />
            <span className="text-slate-500 text-sm font-bold">قام الكاتب بإيقاف التعليقات على هذه التغريدة</span>
          </div>
        ) : (
          <div className="p-4 border-b border-slate-800 flex items-start gap-3 bg-[#111]">
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="You" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                  {currentUsername?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="أضف ردك الخاص..."
                className="w-full bg-transparent text-white text-[15px] resize-none focus:outline-none min-h-[40px] pt-2"
                rows={1}
              />
              <div className="flex justify-between items-center border-t border-slate-800/50 pt-2 mt-1">
                <button className="text-cyan-500 p-1.5 rounded-full hover:bg-cyan-500/10 transition-colors">
                  <ImageIcon size={18} />
                </button>
                <button 
                  onClick={handleAddComment}
                  disabled={!commentContent.trim() || isSubmitting}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1.5 px-4 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> رد
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-slate-800/50 flex space-x-3 space-x-reverse">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 overflow-hidden shrink-0">
                {comment.author?.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  comment.author?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer" onClick={() => router.push(`/${comment.author?.username}`)}>
                    {comment.author?.username}
                  </span>
                  <span className="text-slate-500 text-sm">@{comment.author?.username}</span>
                </div>
                {comment.content && <p className="text-slate-200 text-[15px] mt-1 break-words">{comment.content}</p>}
                {comment.media_url && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800/50 inline-block">
                    <img 
                      src={comment.media_url} 
                      alt="Comment media" 
                      className="max-h-[250px] max-w-full object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                      onClick={() => setExpandedImage(comment.media_url)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center p-8 text-slate-500">
              لا توجد ردود حتى الآن. كن أول من يرد!
            </div>
          )}
        </div>

        <BottomNav activeTab={'' as any} />
      </div>
    </div>
  );
}
