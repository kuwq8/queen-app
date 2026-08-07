'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
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
        .select('username')
        .eq('id', session.user.id)
        .single();
        
      if (profile) {
        setCurrentUsername(profile.username || session.user.user_metadata?.full_name || 'مستخدم');
      }

      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_user_id_fkey(id, username, avatar_url)')
        .eq('id', postId)
        .single();
        
      if (postData) {
        setPost(postData);
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
          _count: { ...prev._count, comments: (prev._count?.comments || 0) + 1 }
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
        <div className="p-4 flex space-x-3 space-x-reverse border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-slate-300">
            {currentUsername?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex items-center bg-slate-900 rounded-full px-4 py-1 border border-slate-800 focus-within:border-cyan-500 transition-colors">
            <input 
              type="text" 
              placeholder="اكتب ردك هنا..." 
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              className="flex-1 bg-transparent text-white focus:outline-none text-[15px]"
            />
            <button 
              onClick={handleAddComment}
              disabled={!commentContent.trim() || isSubmitting}
              className="text-cyan-500 p-2 disabled:text-slate-600 hover:bg-slate-800 rounded-full transition-colors transform rotate-180"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-slate-800/50 flex space-x-3 space-x-reverse">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 overflow-hidden">
                {comment.author?.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  comment.author?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer" onClick={() => router.push(`/${comment.author?.username}`)}>
                    {comment.author?.username}
                  </span>
                  <span className="text-slate-500 text-sm">@{comment.author?.username}</span>
                </div>
                {comment.content && <p className="text-slate-200 text-[15px] mt-1">{comment.content}</p>}
                {comment.mediaUrl && (
                  <div className="mt-2">
                    <audio src={comment.mediaUrl} controls className="h-8 max-w-full" />
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
