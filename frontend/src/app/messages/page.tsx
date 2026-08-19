'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, User, Plus } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      setCurrentUserId(session.user.id);

      // Fetch conversations where the user is a participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations (
            updated_at
          )
        `)
        .eq('user_id', session.user.id)
        .order('conversations(updated_at)', { ascending: false });

      if (participants && participants.length > 0) {
        const convIds = participants.map(p => p.conversation_id);
        
        // For each conversation, fetch the *other* participant's profile
        // and the latest message
        const convos = await Promise.all(convIds.map(async (cid) => {
           const { data: otherUser } = await supabase
             .from('conversation_participants')
             .select('profiles(id, username, avatar_url)')
             .eq('conversation_id', cid)
             .neq('user_id', session.user.id)
             .single();
             
           const { data: latestMsg } = await supabase
             .from('messages')
             .select('content, created_at, sender_id, is_read')
             .eq('conversation_id', cid)
             .order('created_at', { ascending: false })
             .limit(1)
             .single();

           return {
             id: cid,
             otherUser: otherUser?.profiles,
             latestMessage: latestMsg
           };
        }));
        
        // Sort by latest message date or updated_at
        convos.sort((a, b) => {
          const timeA = a.latestMessage ? new Date(a.latestMessage.created_at).getTime() : 0;
          const timeB = b.latestMessage ? new Date(b.latestMessage.created_at).getTime() : 0;
          return timeB - timeA;
        });

        setConversations(convos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
     alert("يمكنك بدء محادثة بالذهاب إلى ملف المستخدم والضغط على 'مراسلة'");
  };

  return (
    <div className="w-full flex flex-col relative pb-[60px] min-h-screen bg-black font-sans text-right">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white px-2">الرسائل</h2>
        <button onClick={handleStartChat} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-white">
          <Plus size={24} />
        </button>
      </header>

      <main className="flex-1 p-4 animate-fade-in-up">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse text-cyan-500 text-sm font-bold">جاري تحميل الرسائل...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center p-12 text-slate-500 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-slate-700" />
            </div>
            <h3 className="text-white text-lg font-bold mb-2">مرحباً بك في صندوق الوارد</h3>
            <p className="text-sm">تواصل مع أصدقائك وشارك أفكارك في رسائل خاصة ومباشرة.</p>
            <button onClick={handleStartChat} className="mt-6 bg-white text-black font-bold px-6 py-2 rounded-full hover:bg-slate-200 transition-colors">
              رسالة جديدة
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv) => {
              if (!conv.otherUser) return null;
              
              const isUnread = conv.latestMessage && 
                               conv.latestMessage.sender_id !== currentUserId && 
                               !conv.latestMessage.is_read;

              return (
                <Link href={`/messages/${conv.id}`} key={conv.id} className="block group">
                  <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-900 transition-all cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                      {conv.otherUser.avatar_url ? (
                        <img src={conv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[15px] truncate ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                          {conv.otherUser.username}
                        </span>
                        {conv.latestMessage && (
                          <span className="text-slate-500 text-[12px] shrink-0">
                            {new Date(conv.latestMessage.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[14px] truncate ${isUnread ? 'text-white font-bold' : 'text-slate-400'}`}>
                          {conv.latestMessage ? conv.latestMessage.content : 'بدأت المحادثة'}
                        </p>
                        {isUnread && (
                          <div className="w-2.5 h-2.5 bg-sky-500 rounded-full shrink-0"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav activeTab="messages" />
    </div>
  );
}
