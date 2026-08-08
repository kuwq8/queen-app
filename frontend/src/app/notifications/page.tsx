'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, UserPlus, ArrowRight } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }
      
      // Fetch Supabase notifications
      const { data } = await supabase
        .from('social_notifications')
        .select(`
          *,
          actor:profiles!actor_id(username, avatar_url)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setNotifications(data);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'like': return <Heart size={20} className="text-pink-500 fill-pink-500" />;
      case 'comment': return <MessageCircle size={20} className="text-cyan-500 fill-cyan-500" />;
      case 'follow': return <UserPlus size={20} className="text-purple-500" />;
      default: return null;
    }
  };

  const getMessage = (notification: any) => {
    if (!notification.actor) return <span>مستخدم مجهول</span>;
    switch (notification.type.toLowerCase()) {
      case 'like': return <span><b className="text-white" dir="ltr">@{notification.actor.username}</b> أعجبه منشورك</span>;
      case 'comment': return <span><b className="text-white" dir="ltr">@{notification.actor.username}</b> علق على منشورك</span>;
      case 'follow': return <span><b className="text-white" dir="ltr">@{notification.actor.username}</b> بدأ بمتابعتك</span>;
      default: return <span>إشعار جديد</span>;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (notification.type === 'FOLLOW') {
      router.push(`/${notification.actor?.username}`);
    } else if (notification.postId) {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', session.user.id).single();
        if (profile) {
          router.push(`/${profile.username}`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-black text-right font-sans">
      <div className="w-full max-w-[600px] flex flex-col relative border-x border-slate-800 min-h-screen bg-black">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-slate-800 p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 -mr-2 rounded-full hover:bg-slate-800 transition-colors sm:hidden">
              <ArrowRight size={20} className="text-white" />
            </button>
            <h1 className="font-bold text-xl text-white">الإشعارات</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-pulse text-cyan-500 font-bold">جاري تحميل الإشعارات...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 font-bold">
              <span className="text-4xl mb-4">🔔</span>
              <p>لا توجد إشعارات بعد</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-900 transition-colors ${!notification.read ? 'bg-cyan-950/10' : ''}`}
                >
                  <div className="w-10 flex justify-start pl-2 pt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden mb-2">
                      {notification.actor.profile?.avatarUrl ? (
                        <img src={notification.actor.profile.avatarUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-300">
                          {notification.actor.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-[15px] text-slate-300">
                      {getMessage(notification)}
                    </div>
                    {notification.post && (
                      <div className="mt-2 text-slate-500 text-sm line-clamp-2 italic">
                        "{notification.post.content}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav activeTab="notifications" />
      </div>
    </div>
  );
}
