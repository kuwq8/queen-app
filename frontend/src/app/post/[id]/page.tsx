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
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUsername(payload.username);
    } catch(e) {}
    
    fetchPostAndComments(token);
  }, [postId, router]);

  const fetchPostAndComments = async (token: string) => {
    try {
      // We need a specific endpoint to fetch a single post, but for now we can fetch the feed and find it
      // Wait, let's just fetch feed and filter (since we didn't build GET /posts/:id).
      const feedRes = await fetch(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const foundPost = feedData.find((p: any) => p.id === postId);
        if (foundPost) setPost(foundPost);
      }

      const commentsRes = await fetch(`${API_URL}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
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
    const token = getToken();
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ content: commentContent })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments([newComment, ...comments]);
        setCommentContent('');
        setPost((prev: any) => ({
          ...prev,
          _count: { ...prev._count, comments: prev._count.comments + 1 }
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
    return <div className="min-h-screen flex items-center justify-center bg-black text-cyan-500">Loading...</div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-xl font-bold mb-4">Post not found</h1>
        <button onClick={() => router.back()} className="text-cyan-500 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-black">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black pb-[60px]">
        
        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md flex items-center px-4 py-3 space-x-6 border-b border-slate-800/50">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-800 transition-colors">
            <ArrowLeft className="text-white" size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">Post</h2>
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
        <div className="p-4 flex space-x-3 border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-slate-300">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 flex items-center bg-slate-900 rounded-full px-4 py-1 border border-slate-800 focus-within:border-cyan-500 transition-colors">
            <input 
              type="text" 
              placeholder="Post your reply..." 
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              className="flex-1 bg-transparent text-white focus:outline-none text-[15px]"
            />
            <button 
              onClick={handleAddComment}
              disabled={!commentContent.trim() || isSubmitting}
              className="text-cyan-500 p-2 disabled:text-slate-600 hover:bg-slate-800 rounded-full transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-slate-800/50 flex space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 overflow-hidden">
                {comment.author.profile?.avatarUrl ? (
                  <img src={comment.author.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  comment.author.username.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer" onClick={() => router.push(`/${comment.author.username}`)}>
                    {comment.author.username}
                  </span>
                  <span className="text-slate-500 text-sm">@{comment.author.username}</span>
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
              No replies yet. Be the first to reply!
            </div>
          )}
        </div>

        <BottomNav activeTab={'' as any} />
      </div>
    </div>
  );
}
