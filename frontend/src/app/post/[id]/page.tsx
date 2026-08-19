'use client';


import { API_URL, getToken } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, MessageSquareOff, ImageIcon, Sparkles, X, Search, PlaySquare } from 'lucide-react';
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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        .select('*, author:profiles(id, username, avatar_url)')
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
        supabase.rpc('increment_post_views', { post_id_val: postId }).then(({error}) => { if (error) console.error(error) });
      }

      // Fetch comments (if table exists)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*, author:profiles(id, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });
        
      if (commentsError) {
        console.error("Comments error:", commentsError);
      }
        
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
    if (!commentContent.trim() && !mediaFile && !mediaPreview) return;
    setIsSubmitting(true);
    
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      let finalMediaUrl = mediaPreview && mediaPreview.startsWith('http') ? mediaPreview : null;
      
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post_media')
          .upload(filePath, mediaFile);
          
        if (!uploadError) {
          const { data } = supabase.storage.from('post_media').getPublicUrl(filePath);
          finalMediaUrl = data.publicUrl;
        }
      }

      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: session.user.id,
          content: commentContent,
          media_url: finalMediaUrl
        })
        .select('*, author:profiles(id, username, avatar_url)')
        .single();
        
      if (newComment) {
        setComments(prev => [newComment, ...prev]);
      } else {
        // Fallback optimistic update if select fails
        const fakeComment = {
          id: Math.random().toString(),
          post_id: postId,
          user_id: session.user.id,
          content: commentContent,
          media_url: finalMediaUrl,
          created_at: new Date().toISOString(),
          author: {
            id: session.user.id,
            username: currentUsername || 'User',
            avatar_url: currentUserAvatar || ''
          }
        };
        setComments(prev => [fakeComment as any, ...prev]);
        if (error) console.error("Error inserting comment:", error);
      }
      
      setCommentContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setShowGifPicker(false);
      setPost((prev: any) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1
      }));
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setShowGifPicker(false);
    }
  };

  const searchGifs = async (query: string) => {
    try {
      const url = query.trim() 
        ? `https://tenor.googleapis.com/v2/search?q=${query}&key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'}&client_key=gemini_social&limit=20`
        : `https://tenor.googleapis.com/v2/featured?key=${process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'}&client_key=gemini_social&limit=20`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) {
        setGifs(data.results);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (showGifPicker) searchGifs(gifSearch);
  }, [gifSearch, showGifPicker]);

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
            <div className="flex-1 min-w-0 flex flex-col gap-2 pt-1">
              <textarea 
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="أضف ردك الخاص..."
                className="w-full bg-transparent text-white text-[15px] resize-none focus:outline-none min-h-[40px]"
                rows={1}
              />
              <div className="flex justify-between items-center border-t border-slate-800/50 pt-2 mt-1">
                <div className="flex gap-1">
                  <input 
                    id="reply-image-input"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageChange} 
                  />
                  <label htmlFor="reply-image-input" className="text-cyan-500 p-1.5 rounded-full hover:bg-cyan-500/10 transition-colors cursor-pointer flex items-center justify-center">
                    <ImageIcon size={18} />
                  </label>
                  <button onClick={() => setShowGifPicker(!showGifPicker)} className="text-cyan-500 hover:bg-cyan-500/10 transition-colors flex items-center justify-center p-1.5 rounded-full">
                    <span className="border border-cyan-500 rounded px-1.5 py-0.5 text-[10px] font-bold">GIF</span>
                  </button>
                </div>
                <button 
                  onClick={handleAddComment}
                  disabled={(!commentContent.trim() && !mediaPreview) || isSubmitting}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-1.5 px-5 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  رد
                </button>
              </div>
              
              {mediaPreview && (
                <div className="relative mt-2 max-w-xs rounded-xl overflow-hidden border border-slate-700">
                  <img src={mediaPreview} alt="Preview" className="w-full object-cover" />
                  <button 
                    onClick={() => { setMediaPreview(null); setMediaFile(null); }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-black p-1 rounded-full text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {showGifPicker && (
                <div className="mt-2 border border-slate-700 rounded-xl overflow-hidden bg-[#111]">
                  <div className="p-2 border-b border-slate-700 flex gap-2 items-center">
                    <Search size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="ابحث عن GIF..."
                      className="bg-transparent text-white outline-none text-sm w-full"
                      value={gifSearch}
                      onChange={e => setGifSearch(e.target.value)}
                    />
                  </div>
                  <div className="h-[200px] overflow-y-auto p-1 grid grid-cols-2 gap-1 custom-scrollbar">
                    {gifs.map(gif => (
                      <img 
                        key={gif.id} 
                        src={gif.media_formats?.tinygif?.url} 
                        alt="GIF"
                        className="w-full h-24 object-cover cursor-pointer rounded hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setMediaPreview(gif.media_formats?.gif?.url);
                          setMediaFile(null);
                          setShowGifPicker(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-slate-800/50 flex gap-3 text-right hover:bg-[#111] transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 overflow-hidden shrink-0 border border-slate-700">
                {comment.author?.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span dir="ltr">{comment.author?.username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-end gap-1.5 flex-wrap flex-row-reverse mb-1">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer break-all" dir="ltr" onClick={() => router.push(`/${comment.author?.username}`)}>
                    {comment.author?.username}
                  </span>
                  <span className="text-slate-500 text-sm break-all" dir="ltr">@{comment.author?.username}</span>
                  <span className="text-slate-500 text-sm">·</span>
                  <span className="text-slate-500 text-sm">{formatTime(comment.created_at)}</span>
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
            <div className="text-center p-8 text-slate-500 text-sm font-bold">
              لا توجد ردود حتى الآن. كن أول من يرد!
            </div>
          )}
        </div>

        <BottomNav activeTab={'' as any} />
      </div>
    </div>
  );
}
